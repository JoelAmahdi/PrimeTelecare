import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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

/**
 * Initiates Google OAuth Sign-In via Firebase popup and registers/authenticates
 * the user in the Prime Telecare backend database.
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
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

    let message = error?.message || 'Failed to authenticate with Google.';
    if (error.code === 'auth/popup-closed-by-user') {
      message = 'Sign-in window closed before completion.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      message = 'Sign-in was cancelled.';
    } else if (error.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      message = `Domain "${currentHost}" is not authorized. Please add "${currentHost}" in Firebase Console > Authentication > Settings > Authorized domains.`;
    } else if (error.code === 'auth/operation-not-allowed') {
      message = 'Google sign-in is not enabled in Firebase Console (Authentication > Sign-in method > Google).';
    } else if (error.code === 'auth/popup-blocked') {
      message = 'Popup blocked by browser. Please allow popups for this site.';
    }

    return {
      success: false,
      error: message,
    };
  }
}

