import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  updateEmail as firebaseUpdateEmail,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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

// Update user profile information in Auth and Firestore
export const updateUserProfile = async (
  displayName: string,
  photoURL: string,
  email?: string,
  phoneNumber?: string
): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No user logged in");

  await updateProfile(currentUser, { displayName, photoURL });

  if (email && email.trim() !== currentUser.email) {
    try {
      await firebaseUpdateEmail(currentUser, email.trim());
    } catch (authErr) {
      console.warn("Could not update email in Firebase Auth (re-auth required), updating in Firestore:", authErr);
    }
  }

  const ref = doc(db, 'users', currentUser.uid);
  await updateDoc(ref, {
    displayName,
    photoURL,
    ...(email ? { email: email.trim() } : {}),
    ...(phoneNumber ? { phoneNumber: phoneNumber.trim() } : { phoneNumber: "" }),
  });
};

// Get top users ordered by totalXP for the leaderboard
export const getLeaderboard = async (limitCount: number = 10): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('totalXP', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const users: UserProfile[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      users.push({
        ...data,
        totalXP: data.totalXP || 0,
      } as UserProfile);
    });
    return users;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

// Configure Google Sign-In
let GoogleSignin: any;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.warn("Google Sign-In module is not loaded yet:", e);
}

export const configureGoogleSignIn = () => {
  if (GoogleSignin) {
    GoogleSignin.configure({
      // Use the Web OAuth client (client_type: 3) — NOT the Android client (type: 1)
      // The Web client ID is required for Firebase Google Auth on Android
      webClientId: '438957272127-87li3bp7lf6888fljlg49d7an5mlfa06.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }
};

// Sign in / Sign up with Google
export const signInWithGoogle = async (): Promise<User> => {
  if (!GoogleSignin || !GoogleSignin.signIn) {
    throw new Error("Google Sign-In native module is not available. Ensure you are running on a physical device/emulator using a custom Development Client build, not Expo Go.");
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    if (!idToken) throw new Error("No ID token returned from Google Sign-In");

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    // Create their Firestore profile if they don't have one
    await createUserProfile(userCredential.user, userCredential.user.displayName || undefined);

    return userCredential.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    let msg = error.message || 'Đăng nhập Google thất bại';
    if (error.code === '10' || error.message?.includes('10') || error.message?.includes('DEVELOPER_ERROR')) {
      msg = 'DEVELOPER_ERROR (Code 10): Vui lòng kiểm tra xem bạn đã bật nhà cung cấp Google trong Firebase Authentication chưa, và đảm bảo mã SHA-1 của thiết bị chạy đã được đăng ký chính xác trên Firebase Console.';
    } else if (error.code === '7' || error.message?.includes('network_error')) {
      msg = 'Network Error (Code 7): Lỗi mạng khi kết nối tới dịch vụ Google. Vui lòng kiểm tra kết nối internet.';
    } else if (error.code === '12500') {
      msg = 'Google Play Services Error (Code 12500): Thiết bị của bạn cần cập nhật hoặc cài đặt Google Play Services.';
    }
    throw new Error(msg);
  }
};
