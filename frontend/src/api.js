import axios from 'axios';

/**
 * Get API base URL with proper fallback logic
 * Priority:
 * 1. VITE_API_URL (for production deployments like Netlify)
 * 2. VITE_API_BASE_URL (for local development override)
 * 3. Localhost default for development (http://localhost:8000/api/v1)
 */
const getBaseUrl = () => {
  // Production or explicit override
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Development override
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Default localhost for development
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle connection errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error (backend down)
      console.error('Network Error: Backend might be down', error);
      throw new Error('Could not connect to the backend server. Please check your connection or try again later.');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login/access-token', formData);
    return response.data;
  },
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const wasteAPI = {
  // Classify waste using Multipart form data
  classifyWaste: async (file, location = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (location) {
      formData.append('location', JSON.stringify(location));
    }
    const response = await api.post('/waste/classify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user's waste history
  getHistory: async (limit = 50) => {
    const response = await api.get(`/waste/history?limit=${limit}`);
    return response.data;
  },

  // Get pending pickups (Driver)
  getPending: async () => {
    const response = await api.get('/waste/pending');
    return response.data;
  },

  // Accept pickup (Driver)
  acceptPickup: async (entryId) => {
    const response = await api.post(`/waste/${entryId}/accept`);
    return response.data;
  },

  // Confirm collection (Driver)
  collectWaste: async (entryId, file, location = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (location) {
      formData.append('location', JSON.stringify(location));
    }
    const response = await api.post(`/waste/${entryId}/collect`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get analytics
  getAnalytics: async () => {
    const response = await api.get('/waste/analytics');
    return response.data;
  },

  // WebSocket URL
  getWsUrl: (token) => {
    const wsBase = API_BASE_URL.replace('http', 'ws');
    return `${wsBase}/waste/ws/${token}`;
  }
};

export const googleAuthAPI = {
  login: async (token, role = 'user') => {
    const response = await api.post('/auth/google', { token, role });
    return response.data;
  }
};
