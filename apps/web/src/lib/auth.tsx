/**
 * Authentication Context & Provider
 * ==================================
 *
 * Unified auth using Zustand store as the single source of truth.
 * The Context/Provider pattern is kept for tree-level access and
 * bootstrap logic, but ALL state lives in the Zustand `useAuthStore`.
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

import api, { getAccessToken, setTokens, clearTokens } from './api';
import { useAuthStore } from '@/stores';
import type {
  User,
  UserProfile,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
} from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER — delegates all state to Zustand store
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();

  // ---- read from Zustand (single source of truth) ----
  const user = useAuthStore((s) => s.user) as UserProfile | null;
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storeSetUser = useAuthStore((s) => s.setUser);
  const storeClearUser = useAuthStore((s) => s.clearUser);
  const storeSetLoading = useAuthStore((s) => s.setLoading);

  // Fetch current user from API and push into Zustand
  const fetchUser = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        storeClearUser();
        return;
      }

      const response = await api.get<UserProfile>('/api/v1/auth/me');
      storeSetUser(response.data as unknown as User);
    } catch (_error) {
      storeClearUser();
      clearTokens();
    }
  }, [storeSetUser, storeClearUser]);

  // Bootstrap on mount
  useEffect(() => {
    const initAuth = async () => {
      storeSetLoading(true);
      await fetchUser();
      storeSetLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login
  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        const response = await api.post<TokenResponse>('/api/v1/auth/login', data);
        const { access_token, refresh_token, user: userData } = response.data;

        setTokens(access_token, refresh_token);
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Push user into Zustand immediately
        storeSetUser(userData as unknown as User);

        // Also hydrate from /me to get full profile
        await fetchUser();

        // Redirect based on role
        switch (userData.role) {
          case 'ADMIN':
            navigate('/admin');
            break;
          case 'DRIVER':
            navigate('/driver');
            break;
          default:
            navigate('/dashboard');
        }
      } catch (error) {
        clearTokens();
        storeClearUser();
        throw error;
      }
    },
    [fetchUser, navigate, storeSetUser, storeClearUser]
  );

  // Register
  const register = useCallback(
    async (data: RegisterRequest) => {
      await api.post<User>('/api/v1/auth/register', data);
      await login({ email: data.email, password: data.password });
    },
    [login]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.post('/api/v1/auth/logout', {
        refresh_token: localStorage.getItem('smart_waste_refresh_token'),
      });
    } catch (_error) {
      // Ignore errors on logout
    } finally {
      clearTokens();
      storeClearUser();
      navigate('/login');
    }
  }, [navigate, storeClearUser]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { AuthContext };
