'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { safeFetch, authFetch } from '@/lib/api-safe';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; full_name: string; role: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const result = await safeFetch<{ access_token: string }>('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            timeout: 15000,
          });

          if (!result.ok || !result.data) {
            throw new Error(result.error || 'Login failed. Please try again.');
          }

          const { access_token } = result.data;
          Cookies.set('token', access_token, { expires: 7 });
          
          // Fetch user data
          const userResult = await authFetch<User>('/api/v1/auth/me', access_token);
          
          if (userResult.ok && userResult.data) {
            set({ user: userResult.data, token: access_token, isAuthenticated: true });
          } else {
            throw new Error('Failed to fetch user data');
          }
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (data) => {
        set({ isLoading: true });
        try {
          const result = await safeFetch('/api/v1/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
            timeout: 15000,
          });

          if (!result.ok) {
            throw new Error(result.error || 'Signup failed. Please try again.');
          }

          // Auto-login after signup
          await get().login(data.email, data.password);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        Cookies.remove('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      checkAuth: async () => {
        const token = Cookies.get('token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const result = await authFetch<User>('/api/v1/auth/me', token, { timeout: 5000 });

          if (result.ok && result.data) {
            set({ user: result.data, token, isAuthenticated: true });
          } else {
            Cookies.remove('token');
            set({ user: null, token: null, isAuthenticated: false });
          }
        } catch {
          set({ isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
