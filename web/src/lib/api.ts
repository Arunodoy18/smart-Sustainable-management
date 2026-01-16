import { config, endpoints } from './config';
import type { 
  AuthTokens, 
  LoginCredentials, 
  SignupData, 
  User, 
  WasteEntry, 
  Analytics,
  Location
} from './types';

const TOKEN_KEY = 'swm_access_token';

// API Error types for proper error handling
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  isNetworkError?: boolean;
  isAuthError?: boolean;
}

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  isNetworkError: boolean;
  isAuthError: boolean;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.status = error.status;
    this.code = error.code;
    this.isNetworkError = error.isNetworkError || false;
    this.isAuthError = error.isAuthError || false;
  }
}

// Token management
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      console.error('Failed to save token:', err);
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors during cleanup
    }
  },
};

function getErrorMessage(status: number, detail?: string): string {
  if (detail) return detail;
  
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'Invalid data provided. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server is temporarily unavailable. Please try again later.';
    default:
      return `Request failed (${status})`;
  }
}

// Base fetch with auth headers and proper error handling
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  let response: Response;
  
  try {
    response = await fetch(`${config.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    // Network error - server unreachable
    throw new ApiRequestError({
      message: 'Unable to connect to the server. Please check your internet connection.',
      isNetworkError: true,
    });
  }

  if (!response.ok) {
    const isAuthError = response.status === 401;
    
    // Clear token on auth error
    if (isAuthError) {
      tokenStorage.remove();
    }
    
    let detail: string | undefined;
    try {
      const errorBody = await response.json();
      detail = errorBody.detail || errorBody.message;
    } catch {
      // Response wasn't JSON
    }
    
    throw new ApiRequestError({
      message: getErrorMessage(response.status, detail),
      status: response.status,
      isAuthError,
    });
  }

  try {
    return await response.json();
  } catch {
    throw new ApiRequestError({
      message: 'Invalid response from server',
      status: response.status,
    });
  }
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    let response: Response;
    
    try {
      response = await fetch(`${config.apiUrl}${endpoints.auth.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
    } catch {
      throw new ApiRequestError({
        message: 'Unable to connect to the server. Please check your internet connection.',
        isNetworkError: true,
      });
    }

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Response wasn't JSON
      }
      
      // Provide user-friendly messages for common login errors
      let message: string;
      if (response.status === 400) {
        message = detail || 'Invalid email or password';
      } else if (response.status === 401) {
        message = 'Invalid email or password';
      } else {
        message = getErrorMessage(response.status, detail);
      }
      
      throw new ApiRequestError({
        message,
        status: response.status,
        isAuthError: response.status === 401,
      });
    }

    let tokens: AuthTokens;
    try {
      tokens = await response.json();
    } catch {
      throw new ApiRequestError({
        message: 'Invalid response from server',
        status: response.status,
      });
    }
    
    tokenStorage.set(tokens.access_token);
    return tokens;
  },

  signup: async (data: SignupData): Promise<User> => {
    return fetchWithAuth<User>(endpoints.auth.signup, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<User> => {
    return fetchWithAuth<User>(endpoints.auth.me);
  },

  logout: (): void => {
    tokenStorage.remove();
  },
};

// Waste API
export const wasteApi = {
  classify: async (file: File, location?: Location): Promise<WasteEntry> => {
    const formData = new FormData();
    formData.append('file', file);
    if (location) {
      formData.append('location', JSON.stringify(location));
    }

    return fetchWithAuth<WasteEntry>(endpoints.waste.classify, {
      method: 'POST',
      body: formData,
    });
  },

  getHistory: async (limit = 50): Promise<WasteEntry[]> => {
    return fetchWithAuth<WasteEntry[]>(`${endpoints.waste.history}?limit=${limit}`);
  },

  getPending: async (): Promise<WasteEntry[]> => {
    return fetchWithAuth<WasteEntry[]>(endpoints.waste.pending);
  },

  acceptPickup: async (entryId: string): Promise<WasteEntry> => {
    return fetchWithAuth<WasteEntry>(endpoints.waste.accept(entryId), {
      method: 'POST',
    });
  },

  collectPickup: async (
    entryId: string,
    proofImage: File,
    location?: Location
  ): Promise<WasteEntry> => {
    const formData = new FormData();
    formData.append('file', proofImage);
    if (location) {
      formData.append('location', JSON.stringify(location));
    }

    return fetchWithAuth<WasteEntry>(endpoints.waste.collect(entryId), {
      method: 'POST',
      body: formData,
    });
  },

  getAnalytics: async (): Promise<Analytics> => {
    return fetchWithAuth<Analytics>(endpoints.waste.analytics);
  },
};
