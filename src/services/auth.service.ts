import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types/auth.types';

// Create user document in Firestore after registration
const createUserProfile = async (user: User, displayName?: string): Promise<void> => {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // Already exists, skip

  const profile: Omit<UserProfile, 'createdAt'> & { createdAt: any } = {
    uid: user.uid,
    displayName: displayName ?? user.displayName ?? 'SignBridge User',
    email: user.email ?? '',
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
    totalXP: 0,
    streakDays: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
  };

  await setDoc(ref, profile);
};

// Register with email + password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await createUserProfile(credential.user, displayName);
  return credential.user;
};

// Login with email + password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

// Sign out
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Get Firestore user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

// Subscribe to auth state changes — call this once at app start
export const subscribeToAuthState = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};
