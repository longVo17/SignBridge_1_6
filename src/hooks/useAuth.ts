import { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signOut, signInWithGoogle } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, status } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // Auth state listener in AppNavigator will handle navigation
    } catch (err: any) {
      setError(mapFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (err: any) {
      setError(mapFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  return { user, status, loading, error, login, register, logout, loginWithGoogle, clearError: () => setError(null) };
};

// Map Firebase error codes → user-friendly Vietnamese messages
const mapFirebaseError = (code: string): string => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không đúng.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký.';
    case 'auth/weak-password':
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Kiểm tra internet của bạn.';
    case 'auth/too-many-requests':
      return 'Quá nhiều lần thử. Vui lòng thử lại sau.';
    default:
      return 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
};
