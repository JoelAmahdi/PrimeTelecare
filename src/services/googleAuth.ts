import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import { primeApi } from './apiClient';
import { User } from '../types';

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
 * Checks for a pending redirect result (used after signInWithRedirect on mobile)
 */
export async function checkGoogleRedirectResult(): Promise<GoogleAuthResult | null> {
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
      role: 'patient',
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
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  // On iOS Safari / mobile, popups often fail due to WebKit cross-origin ITP restrictions.
  // Use redirect for mobile devices:
  if (isMobileDevice()) {
    try {
      await signInWithRedirect(firebaseAuth, googleProvider);
      return { success: true }; // Page is redirecting
    } catch (e: any) {
      console.warn('Redirect sign-in error, falling back to popup:', e);
    }
  }

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
      role: 'patient',
    });

    return {
      success: true,
      user: apiRes.user,
      token: apiRes.token,
    };
  } catch (error: any) {
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
export async function directGoogleLogin(email: string, name?: string): Promise<GoogleAuthResult> {
  try {
    const apiRes = await primeApi.googleAuth({
      email: email.trim().toLowerCase(),
      name: name || email.split('@')[0],
      role: 'patient',
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

