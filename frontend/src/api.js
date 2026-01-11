import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const wasteAPI = {
  // Classify and record waste (using multipart/form-data)
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

  // Get user's waste entries
  getHistory: async (limit = 50) => {
    const response = await api.get(`/waste/history?limit=${limit}`);
    return response.data;
  },

  // Get pending pickups (Driver only)
  getPendingPickups: async () => {
    const response = await api.get('/waste/pending');
    return response.data;
  },

  // Accept a pickup (Driver)
  acceptPickup: async (entryId) => {
    const response = await api.post(`/waste/${entryId}/accept`);
    return response.data;
  },

  // Confirm collection with proof image (Driver)
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
};

// WebSocket connection for real-time updates
export const getRealtimeSocket = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  
  const wsUrl = API_BASE_URL.replace('http', 'ws') + `/waste/ws/${session.access_token}`;
  return new WebSocket(wsUrl);
};
