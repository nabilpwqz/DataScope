import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';

// Read configuration securely from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCEGCy_GgbnYx4EfiSM5e91RzF184QDdXA',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test-1bf2f.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-1bf2f',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test-1bf2f.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '31722864794',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:31722864794:web:5f51f597abc94413c95f23',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-E6E6T1TE06',
};

// Safe singleton initialization across SSR and client navigation
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Authentication Helper Functions
export async function loginWithFirebaseEmail(
  email: string,
  pass: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithFirebaseEmail(
  email: string,
  pass: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function loginWithFirebaseGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

export async function logoutFromFirebase(): Promise<void> {
  return firebaseSignOut(auth);
}

export function subscribeToFirebaseAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// Client-side Analytics initialization
export async function initFirebaseAnalytics() {
  if (typeof window !== 'undefined') {
    try {
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      const supported = await isSupported();
      if (supported) {
        return getAnalytics(app);
      }
    } catch (_) {
      // Ignore in environments where analytics is not supported
    }
  }
  return null;
}

export type { FirebaseUser, UserCredential };

