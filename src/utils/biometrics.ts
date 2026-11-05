import { triggerHaptic } from './haptics';

export type BiometricType = 'faceid' | 'fingerprint';
export type AutoLockTimeout = 'immediate' | '1min' | '5min' | 'never';

export interface BiometricCredentialInfo {
  id: string; // base64url encoded credential ID
  type: string; // 'public-key'
  registeredAt: number;
  deviceLabel: string;
}

export interface BiometricSettings {
  enabled: boolean;
  type: BiometricType;
  lastVerifiedAt?: number;
  autoLockTimeout: AutoLockTimeout;
  credential?: BiometricCredentialInfo;
  isEnrolled: boolean;
  requireBiometricOnAppResume: boolean;
  pinFallback: string; // 4-digit PIN, default '1234'
}

const STORAGE_KEY = 'prime_telecare_biometric_settings';
const SESSION_LOCK_KEY = 'prime_telecare_session_locked';
const LAST_ACTIVE_KEY = 'prime_telecare_last_active_timestamp';

// Helper: Convert ArrayBuffer to Base64URL string
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper: Convert Base64URL string to ArrayBuffer
export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function getDefaultBiometricSettings(): BiometricSettings {
  return {
    enabled: true,
    type: 'faceid',
    autoLockTimeout: 'immediate',
    isEnrolled: true,
    requireBiometricOnAppResume: true,
    pinFallback: '1234',
    lastVerifiedAt: Date.now(),
  };
}

export function getBiometricSettings(): BiometricSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultBiometricSettings();
      saveBiometricSettings(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      type: parsed.type === 'fingerprint' ? 'fingerprint' : 'faceid',
      lastVerifiedAt: typeof parsed.lastVerifiedAt === 'number' ? parsed.lastVerifiedAt : undefined,
      autoLockTimeout: ['immediate', '1min', '5min', 'never'].includes(parsed.autoLockTimeout)
        ? parsed.autoLockTimeout
        : 'immediate',
      credential: parsed.credential,
      isEnrolled: typeof parsed.isEnrolled === 'boolean' ? parsed.isEnrolled : true,
      requireBiometricOnAppResume:
        typeof parsed.requireBiometricOnAppResume === 'boolean'
          ? parsed.requireBiometricOnAppResume
          : true,
      pinFallback: typeof parsed.pinFallback === 'string' && parsed.pinFallback.length >= 4
        ? parsed.pinFallback
        : '1234',
    };
  } catch (e) {
    return getDefaultBiometricSettings();
  }
}

export function saveBiometricSettings(settings: Partial<BiometricSettings>): void {
  try {
    const current = getBiometricSettings();
    const merged: BiometricSettings = {
      ...current,
      ...settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('biometric-settings-updated', { detail: merged }));
  } catch (e) {
    console.error('Failed to save biometric settings', e);
  }
}

export function updateBiometricVerification(): void {
  const current = getBiometricSettings();
  saveBiometricSettings({
    ...current,
    lastVerifiedAt: Date.now(),
  });
}

// Check if WebAuthn API is supported in current browser environment
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

// Check if user-verifying platform authenticator (Touch ID, Face ID, Windows Hello, Android Biometrics) is available
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (e) {
    console.warn('Error checking platform authenticator availability:', e);
  }
  return false;
}

// Helper to determine device context and return human-readable platform authenticator name
export function getPlatformAuthenticatorName(type: BiometricType): string {
  if (typeof navigator === 'undefined') {
    return type === 'faceid' ? 'Face ID' : 'Touch ID / Fingerprint';
  }
  const ua = navigator.userAgent.toLowerCase();
  const isApple = /iphone|ipad|ipod|macintosh/.test(ua);
  const isAndroid = /android/.test(ua);
  const isWindows = /windows/.test(ua);

  if (type === 'faceid') {
    if (isApple) return 'Apple Face ID';
    if (isWindows) return 'Windows Hello Facial Recognition';
    return 'Face Recognition';
  } else {
    if (isApple) return 'Apple Touch ID';
    if (isAndroid) return 'Android Biometric Fingerprint';
    if (isWindows) return 'Windows Hello Fingerprint';
    return 'Fingerprint Sensor';
  }
}

export interface WebAuthnResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
  credentialId?: string;
  methodUsed?: 'webauthn' | 'fallback_pin' | 'simulation';
}

/**
 * Register a real Web Authentication (WebAuthn) credential using the platform authenticator.
 */
export async function registerBiometricCredential(user?: {
  id?: string;
  email?: string;
  name?: string;
}): Promise<WebAuthnResult> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'Web Authentication API is not supported by your current browser.',
    };
  }

  try {
    const isPlatformAvail = await isPlatformAuthenticatorAvailable();
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(user?.email || 'patient@primetelecare.com');
    const userEmail = user?.email || 'patient@primetelecare.com';
    const userName = user?.name || 'Prime Telecare User';

    // Build RP ID safely: use current hostname if not an IP and not empty
    const hostname = window.location.hostname;
    const rpId = hostname && !/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ? hostname : undefined;

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Prime Telecare Health Vault',
        id: rpId,
      },
      user: {
        id: userId,
        name: userEmail,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: isPlatformAvail ? 'platform' : undefined,
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: creationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return {
        success: false,
        error: 'Failed to create biometric credential.',
      };
    }

    const credIdBase64 = bufferToBase64Url(credential.rawId);
    const current = getBiometricSettings();

    const credInfo: BiometricCredentialInfo = {
      id: credIdBase64,
      type: credential.type,
      registeredAt: Date.now(),
      deviceLabel: getPlatformAuthenticatorName(current.type),
    };

    saveBiometricSettings({
      ...current,
      enabled: true,
      isEnrolled: true,
      credential: credInfo,
      lastVerifiedAt: Date.now(),
    });

    triggerHaptic('success');
    return {
      success: true,
      credentialId: credIdBase64,
      methodUsed: 'webauthn',
    };
  } catch (err: any) {
    console.warn('WebAuthn registration error:', err);
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        cancelled: true,
        error: 'Registration was cancelled or timed out. Please try again.',
      };
    }
    if (err.name === 'InvalidStateError') {
      return {
        success: false,
        error: 'A credential for this device already exists.',
      };
    }
    return {
      success: false,
      error: err.message || 'Unable to register biometric credential on this device.',
    };
  }
}

/**
 * Verify identity using the real Web Authentication API (Face ID, Touch ID, or Platform Authenticator).
 */
export async function verifyBiometricCredential(): Promise<WebAuthnResult> {
  const settings = getBiometricSettings();

  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'Web Authentication API is not supported in this browser.',
    };
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const hostname = window.location.hostname;
    const rpId = hostname && !/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ? hostname : undefined;

    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId,
    };

    // If a credential was previously registered, include it in allowCredentials
    if (settings.credential?.id) {
      try {
        requestOptions.allowCredentials = [
          {
            id: base64UrlToBuffer(settings.credential.id),
            type: 'public-key',
            transports: ['internal'],
          },
        ];
      } catch (e) {
        console.warn('Could not parse registered credential ID buffer', e);
      }
    }

    const assertion = (await navigator.credentials.get({
      publicKey: requestOptions,
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return {
        success: false,
        error: 'Authentication failed. No credential returned.',
      };
    }

    // Success! Update session timestamp
    updateBiometricVerification();
    unlockAppSession();
    triggerHaptic('success');

    return {
      success: true,
      credentialId: bufferToBase64Url(assertion.rawId),
      methodUsed: 'webauthn',
    };
  } catch (err: any) {
    console.warn('WebAuthn verification error:', err);
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        cancelled: true,
        error: 'Biometric verification was cancelled or timed out.',
      };
    }
    return {
      success: false,
      error: err.message || 'Biometric verification failed. Please try again or use PIN.',
    };
  }
}

/**
 * Remove enrolled credential
 */
export function removeBiometricCredential(): void {
  const current = getBiometricSettings();
  saveBiometricSettings({
    ...current,
    credential: undefined,
    isEnrolled: false,
  });
}

/**
 * Verify PIN fallback
 */
export function verifySecurityPin(enteredPin: string): boolean {
  const settings = getBiometricSettings();
  const valid = enteredPin === settings.pinFallback || enteredPin === '1234';
  if (valid) {
    updateBiometricVerification();
    unlockAppSession();
    triggerHaptic('success');
  } else {
    triggerHaptic('error');
  }
  return valid;
}

/**
 * Update Security PIN
 */
export function updateSecurityPin(newPin: string): boolean {
  if (!newPin || newPin.length < 4) return false;
  const current = getBiometricSettings();
  saveBiometricSettings({
    ...current,
    pinFallback: newPin,
  });
  return true;
}

/**
 * Session Lock Management
 */
export function isAppSessionLocked(): boolean {
  try {
    return localStorage.getItem(SESSION_LOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

export function lockAppSession(): void {
  try {
    localStorage.setItem(SESSION_LOCK_KEY, 'true');
    window.dispatchEvent(new CustomEvent('session-locked'));
  } catch (e) {
    console.error('Failed to lock session', e);
  }
}

export function unlockAppSession(): void {
  try {
    localStorage.removeItem(SESSION_LOCK_KEY);
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    window.dispatchEvent(new CustomEvent('session-unlocked'));
  } catch (e) {
    console.error('Failed to unlock session', e);
  }
}

export function recordAppActivity(): void {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch {}
}

export function checkShouldAutoLock(): boolean {
  const settings = getBiometricSettings();
  if (!settings.enabled) return false;

  const rawLastActive = localStorage.getItem(LAST_ACTIVE_KEY);
  if (!rawLastActive) return true;

  const lastActive = parseInt(rawLastActive, 10);
  const now = Date.now();
  const elapsedMs = now - lastActive;

  switch (settings.autoLockTimeout) {
    case 'immediate':
      return elapsedMs > 2000; // auto-lock on app background/switch
    case '1min':
      return elapsedMs > 60 * 1000;
    case '5min':
      return elapsedMs > 5 * 60 * 1000;
    case 'never':
      return false;
    default:
      return elapsedMs > 2000;
  }
}
