/**
 * Authentication Context & Provider
 * ==================================
 * 
 * React context for authentication state management.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

import api, { getAccessToken, setTokens, clearTokens } from './api';
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
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }

      const response = await api.get<UserProfile>('/api/v1/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
      clearTokens();
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await fetchUser();
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  // Login
  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        const response = await api.post<TokenResponse>('/api/v1/auth/login', data);
        const { access_token, refresh_token, user: userData } = response.data;

        // Set tokens FIRST and wait a tick to ensure storage is complete
        setTokens(access_token, refresh_token);
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for storage

        // Fetch user profile with the new token
        await fetchUser();

        // Set user immediately from login response to avoid loading state
        setUser(userData as UserProfile);

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
        // Clear tokens on login failure
        clearTokens();
        setUser(null);
        throw error;
      }
    },
    [fetchUser, navigate]
  );

  // Register
  const register = useCallback(
    async (data: RegisterRequest) => {
      await api.post<User>('/api/v1/auth/register', data);
      // Auto-login after registration
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
    } catch (error) {
      // Ignore errors on logout
    } finally {
      clearTokens();
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
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
