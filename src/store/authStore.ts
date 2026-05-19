import { create } from 'zustand';
import { AuthUser, AuthStatus } from '../types/auth.types';

interface AuthStore {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: 'loading',

  setUser: (user) =>
    set({ user, status: user ? 'authenticated' : 'unauthenticated' }),

  setStatus: (status) => set({ status }),

  clearAuth: () => set({ user: null, status: 'unauthenticated' }),
}));
