/**
 * API Client
 * ==========
 * 
 * Axios client with interceptors for authentication and error handling.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import type { TokenResponse, ErrorResponse } from '@/types';
import { logger } from './logger';

// Get API base URL from environment (just the backend URL, no /api/v1)
// All API calls should include /api/v1 in their path
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // Increased to 90s to handle Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'smart_waste_access_token';
const REFRESH_TOKEN_KEY = 'smart_waste_refresh_token';

// Get tokens from storage
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Set tokens in storage
export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// Clear tokens from storage
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add auth token if available (optional for public access)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API request
    logger.apiRequest(
      config.method?.toUpperCase() || 'GET',
      config.url || '',
      config.data
    );
    
    // Add request start time for duration tracking
    (config as any).requestStartTime = Date.now();
    
    // If no token, request proceeds without auth header (guest access)
    return config;
  },
  (error) => {
    logger.error('API Request Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh (optional, supports guest access)
api.interceptors.response.use(
  (response) => {
    // Log successful response
    const duration = (response.config as any).requestStartTime 
      ? Date.now() - (response.config as any).requestStartTime 
      : undefined;
    
    logger.apiResponse(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      duration
    );
    
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config;

    // If no config, reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Check if this is a 401 error and we have a token to refresh
    const isRetry = (originalRequest as InternalAxiosRequestConfig & { _retry?: boolean })._retry;
    const refreshToken = getRefreshToken();
    
    // Only attempt token refresh if we have a refresh token and haven't retried yet
    if (error.response?.status === 401 && !isRetry && refreshToken) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      (originalRequest as InternalAxiosRequestConfig & { _retry?: boolean })._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<TokenResponse>(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        setTokens(access_token, refresh_token);

        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and continue as guest
        processQueue(refreshError as Error, null);
        clearTokens();
        logger.warn('Token refresh failed, continuing as guest');
        // Don't redirect - just continue without auth (guest mode)
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log API error
    logger.apiError(
      originalRequest.method?.toUpperCase() || 'GET',
      originalRequest.url || '',
      error
    );

    // For 401 without refresh token, or other errors, just pass through
    // The backend will handle guest access
    return Promise.reject(error);
  }
);

export default api;
