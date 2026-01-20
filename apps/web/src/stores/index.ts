/**
 * Zustand Stores
 * ==============
 * 
 * Global state management stores.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

// ============================================================================
// UI STORE
// ============================================================================

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'smart-waste-ui',
    }
  )
);

// ============================================================================
// UPLOAD STORE
// ============================================================================

export interface UploadState {
  selectedFile: File | null;
  previewUrl: string | null;
  isUploading: boolean;
  progress: number;
  uploadProgress: number; // Alias for progress
  setSelectedFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setProgress: (progress: number) => void;
  setUploadProgress: (progress: number) => void; // Alias for setProgress
  reset: () => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  selectedFile: null,
  previewUrl: null,
  isUploading: false,
  progress: 0,
  uploadProgress: 0,
  setSelectedFile: (file) => set({ selectedFile: file }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setProgress: (progress) => set({ progress, uploadProgress: progress }),
  setUploadProgress: (progress) => set({ progress, uploadProgress: progress }),
  reset: () =>
    set({
      selectedFile: null,
      previewUrl: null,
      isUploading: false,
      progress: 0,
      uploadProgress: 0,
    }),
}));

// ============================================================================
// LOCATION STORE
// ============================================================================

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  currentLocation: { lat: number; lng: number } | null;
  setLocation: (lat: number, lng: number) => void;
  setCurrentLocation: (location: { lat: number; lng: number } | null) => void;
  setAddress: (address: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  requestLocation: () => void;
}

export const useLocationStore = create<LocationState>()((set) => ({
  latitude: null,
  longitude: null,
  address: null,
  isLoading: false,
  error: null,
  currentLocation: null,
  setLocation: (lat, lng) => set({ 
    latitude: lat, 
    longitude: lng, 
    currentLocation: { lat, lng },
    error: null 
  }),
  setCurrentLocation: (location) => set({ 
    currentLocation: location,
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
  }),
  setAddress: (address) => set({ address }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  requestLocation: () => {
    set({ isLoading: true, error: null });

    if (!navigator.geolocation) {
      set({ error: 'Geolocation is not supported', isLoading: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        set({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          currentLocation: { 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          },
          isLoading: false,
        });
      },
      (error) => {
        set({
          error: error.message,
          isLoading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  },
}));

// ============================================================================
// NOTIFICATION STORE
// ============================================================================

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: Math.random().toString(36).substring(2, 9),
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));

// ============================================================================
// AUTH STORE
// ============================================================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
      clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'smart-waste-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
