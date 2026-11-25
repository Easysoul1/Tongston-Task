import { create } from 'zustand';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import type { User } from '../types';

interface BalanceState {
  balance: number;
  setBalance: (balance: number) => void;
  addBalance: (amount: number) => void;
  subtractBalance: (amount: number) => void;
  reset: () => void;
}

function readStoredBalance(): number {
  if (typeof window === 'undefined') return 0;
  const parsed = Number.parseInt(window.localStorage.getItem('tongston_balance') || '0', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  balance: readStoredBalance(),
  setBalance: (balance) => {
    set({ balance });
    if (typeof window !== 'undefined') localStorage.setItem('tongston_balance', String(balance));
  },
  addBalance: (amount) => set((state) => {
    const newBalance = state.balance + amount;
    if (typeof window !== 'undefined') localStorage.setItem('tongston_balance', String(newBalance));
    return { balance: newBalance };
  }),
  subtractBalance: (amount) => set((state) => {
    const newBalance = state.balance - amount;
    if (typeof window !== 'undefined') localStorage.setItem('tongston_balance', String(newBalance));
    return { balance: newBalance };
  }),
  reset: () => {
    set({ balance: 0 });
    if (typeof window !== 'undefined') localStorage.removeItem('tongston_balance');
  },
}));

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

function readStoredAuth(): { user: User | null; token: string | null } {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const token = window.localStorage.getItem('tongston_token');
    const rawUser = window.localStorage.getItem('tongston_user');
    if (!token || !rawUser) return { user: null, token: null };
    const user = JSON.parse(rawUser) as User;
    if (!user || typeof user !== 'object' || !user.id || !user.email) {
      return { user: null, token: null };
    }
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

const initialAuth = readStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  setAuth: (user, token) => {
    set({ user, token });
    if (typeof window !== 'undefined') {
      localStorage.setItem('tongston_user', JSON.stringify(user));
      localStorage.setItem('tongston_token', token);
    }
  },
  logout: () => {
    set({ user: null, token: null });
    setAuthToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tongston_user');
      localStorage.removeItem('tongston_token');
      localStorage.removeItem('tongston_balance');
    }
  },
}));

setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});
