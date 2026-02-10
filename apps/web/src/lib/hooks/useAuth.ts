/**
 * Auth Hooks
 * ==========
 * 
 * React Query hooks for authentication operations.
 */

import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import api, { setTokens, clearTokens, getRefreshToken } from '@/lib/api';
import type { TokenResponse, User, ErrorResponse } from '@/types';
import { useAuthStore } from '@/stores';

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  first_name: string;
  last_name: string;
  role?: 'CITIZEN' | 'DRIVER' | 'ADMIN';
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

// Login mutation
export function useLogin(): UseMutationResult<TokenResponse, AxiosError<ErrorResponse>, LoginCredentials> {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<TokenResponse>('/api/v1/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      if (data.user) {
        setUser(data.user);
      }
      toast.success('Welcome back!');
      
      // Redirect based on role (API returns UPPERCASE enum values)
      const role = data.user?.role || 'CITIZEN';
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Invalid email or password';
      toast.error(message);
    },
  });
}

// Register mutation
export function useRegister(): UseMutationResult<TokenResponse, AxiosError<ErrorResponse>, RegisterData> {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post<TokenResponse>('/api/v1/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      if (data.user) {
        setUser(data.user);
      }
      toast.success('Account created successfully!');
      navigate('/dashboard');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to create account';
      toast.error(message);
    },
  });
}

// Logout mutation
export function useLogout(): UseMutationResult<void, AxiosError<ErrorResponse>, void> {
  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);

  return useMutation({
    mutationFn: async () => {
      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          await api.post('/api/v1/auth/logout', { refresh_token: refreshToken });
        }
      } catch {
        // Ignore logout errors
      }
    },
    onSettled: () => {
      clearTokens();
      clearUser();
      toast.success('Logged out successfully');
      navigate('/login');
    },
  });
}

// Forgot password mutation
export function useForgotPassword(): UseMutationResult<{ message: string }, AxiosError<ErrorResponse>, ForgotPasswordData> {
  return useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const response = await api.post<{ message: string }>('/api/v1/auth/password/reset', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password reset instructions sent to your email');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to send reset email';
      toast.error(message);
    },
  });
}

// Reset password mutation
export function useResetPassword(): UseMutationResult<{ message: string }, AxiosError<ErrorResponse>, ResetPasswordData> {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const response = await api.post<{ message: string }>('/api/v1/auth/password/reset/confirm', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
      navigate('/login');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to reset password';
      toast.error(message);
    },
  });
}

// Get current user
export function useCurrentUser(): UseMutationResult<User, AxiosError<ErrorResponse>, void> {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async () => {
      const response = await api.get<User>('/api/v1/auth/me');
      return response.data;
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });
}

export default {
  useLogin,
  useRegister,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useCurrentUser,
};
