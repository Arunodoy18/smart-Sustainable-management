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

// Token management
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// Base fetch with auth headers
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

  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${config.apiUrl}${endpoints.auth.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const tokens: AuthTokens = await response.json();
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
