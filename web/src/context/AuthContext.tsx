'use client';

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback,
  ReactNode 
} from 'react';
import { User, LoginCredentials, SignupData } from '@/lib/types';
import { authApi, tokenStorage } from '@/lib/api';
import { wsManager } from '@/lib/websocket';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
      // Connect WebSocket after successful auth
      wsManager.connect();
    } catch (error) {
      console.error('Failed to fetch user:', error);
      tokenStorage.remove();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    return () => {
      wsManager.disconnect();
    };
  }, [refreshUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      await authApi.login(credentials);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    try {
      await authApi.signup(data);
      // After signup, log them in
      await authApi.login({
        username: data.email,
        password: data.password,
      });
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    wsManager.disconnect();
    authApi.logout();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
