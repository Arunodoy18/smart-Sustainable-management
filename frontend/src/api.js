import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
