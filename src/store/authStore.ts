import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  sessionChecked: boolean;
  setLoggedIn: (value: boolean) => void;
  setSessionChecked: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  sessionChecked: false,
  setLoggedIn: (value) => set({ isLoggedIn: value }),
  setSessionChecked: (value) => set({ sessionChecked: value }),
  logout: () => set({ isLoggedIn: false, sessionChecked: true }),
}));
