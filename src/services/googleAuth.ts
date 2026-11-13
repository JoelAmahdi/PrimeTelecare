import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import { primeApi } from './apiClient';
import { User, UserRole } from '../types';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleAuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Directly launches Google's official OAuth Account Picker.
 * Works for any Google user worldwide across mobile Safari, Chrome, and desktop.
 */
export function launchGoogleOAuth(role: UserRole = 'patient'): void {
  try {
    localStorage.setItem('prime_pending_login_role', role);
  } catch {}
  const clientId = '841125042406-0f7ansh4it7lh57cu7fgd2ktt4bgmbp2.apps.googleusercontent.com';
  const redirectUri = window.location.origin;
  const scope = encodeURIComponent('email profile openid');
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token%20id_token&scope=${scope}&nonce=${Date.now()}&prompt=select_account`;
  window.location.href = oauthUrl;
}

/**
 * Checks for a pending redirect result (used after signInWithRedirect on mobile)
 */
export async function checkGoogleRedirectResult(): Promise<GoogleAuthResult | null> {
  const pendingRole = (typeof window !== 'undefined' ? (localStorage.getItem('prime_pending_login_role') as UserRole) : null) || 'patient';

  // First check URL hash for direct OAuth tokens
  if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');

      let email = '';
      let name = '';
      let picture = '';

      if (idToken) {
        try {
          const payloadBase64 = idToken.split('.')[1];
          const decoded = JSON.parse(atob(payloadBase64));
          email = decoded.email || '';
          name = decoded.name || '';
          picture = decoded.picture || '';
        } catch {}
      }

      if (!email && accessToken) {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const info = await res.json();
          email = info.email || '';
          name = info.name || '';
          picture = info.picture || '';
        }
      }

      if (email) {
        window.history.replaceState(null, '', window.location.pathname);
        const apiRes = await primeApi.googleAuth({
          email,
          name: name || email.split('@')[0],
          avatarUrl: picture || undefined,
          role: pendingRole,
        });
        return {
          success: true,
          user: apiRes.user,
          token: apiRes.token,
        };
      }
    } catch (err) {
      console.warn('Direct OAuth hash parsing error:', err);
    }
  }

  try {
    const result = await getRedirectResult(firebaseAuth);
    if (!result || !result.user || !result.user.email) {
      return null;
    }
    const fbUser = result.user;
    const apiRes = await primeApi.googleAuth({
      email: fbUser.email,
      name: fbUser.displayName || fbUser.email.split('@')[0],
      avatarUrl: fbUser.photoURL || undefined,
      googleUid: fbUser.uid,
      role: pendingRole,
    });
    return {
      success: true,
      user: apiRes.user,
      token: apiRes.token,
    };
  } catch (error: any) {
    console.error('Redirect result error:', error);
    return null;
  }
}

/**
 * Initiates Google OAuth Sign-In via Firebase popup (desktop) or redirect (mobile)
 * and registers/authenticates the user in the Prime Telecare backend database.
 */
export async function signInWithGoogle(role: UserRole = 'patient'): Promise<GoogleAuthResult> {
  try {
    localStorage.setItem('prime_pending_login_role', role);
  } catch {}

  // Attempt popup first for both desktop and modern mobile devices.
  // This keeps the SPA state alive and prevents cross-origin session drops on Safari.
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const fbUser = result.user;

    if (!fbUser.email) {
      throw new Error('Google account has no associated email address.');
    }

    // Call backend API to authenticate or register user in store
    const apiRes = await primeApi.googleAuth({
      email: fbUser.email,
      name: fbUser.displayName || fbUser.email.split('@')[0],
      avatarUrl: fbUser.photoURL || undefined,
      googleUid: fbUser.uid,
      role,
    });

    return {
      success: true,
      user: apiRes.user,
      token: apiRes.token,
    };
  } catch (error: any) {
    // If popup was blocked by browser, fall back to redirect
    if ((error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') && isMobileDevice()) {
      try {
        localStorage.setItem('prime_pending_google_redirect', 'true');
        await signInWithRedirect(firebaseAuth, googleProvider);
        return { success: true };
      } catch (redirectErr: any) {
        console.warn('Redirect sign-in error:', redirectErr);
      }
    }

    console.error('Google Sign-In Error:', error);

    const codeTag = error?.code ? `(${error.code}) ` : '';
    let message = error?.message || 'Failed to authenticate with Google.';
    if (error.code === 'auth/popup-closed-by-user') {
      message = 'Sign-in popup was closed before completing.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      message = 'Sign-in was cancelled.';
    } else if (error.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      message = `Domain "${currentHost}" is not authorized on Firebase project "gen-lang-client-0108839770". If on iPhone Safari, redirect is required.`;
    } else if (error.code === 'auth/operation-not-allowed') {
      message = 'Google sign-in is not enabled in Firebase Console (Authentication > Sign-in method > Google).';
    } else if (error.code === 'auth/popup-blocked') {
      message = 'Popup blocked by browser. Please allow popups or use redirect.';
    } else if (error.code === 'auth/internal-error') {
      message = 'Firebase internal error. Please check Google Cloud OAuth credentials.';
    }

    return {
      success: false,
      error: `${codeTag}${message}`,
    };
  }
}

/**
 * Direct Google email fallback in case of strict mobile cookie/popup restrictions
 */
export async function directGoogleLogin(email: string, name?: string, role: UserRole = 'patient'): Promise<GoogleAuthResult> {
  try {
    const apiRes = await primeApi.googleAuth({
      email: email.trim().toLowerCase(),
      name: name || email.split('@')[0],
      role,
    });
    return {
      success: true,
      user: apiRes.user,
      token: apiRes.token,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Google login failed',
    };
  }
}

