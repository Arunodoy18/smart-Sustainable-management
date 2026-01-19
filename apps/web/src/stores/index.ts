/**
 * Zustand Stores
 * ==============
 * 
 * Global state management stores.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface UploadState {
  selectedFile: File | null;
  previewUrl: string | null;
  isUploading: boolean;
  progress: number;
  setSelectedFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  selectedFile: null,
  previewUrl: null,
  isUploading: false,
  progress: 0,
  setSelectedFile: (file) => set({ selectedFile: file }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setProgress: (progress) => set({ progress }),
  reset: () =>
    set({
      selectedFile: null,
      previewUrl: null,
      isUploading: false,
      progress: 0,
    }),
}));

// ============================================================================
// LOCATION STORE
// ============================================================================

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  setLocation: (lat: number, lng: number) => void;
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
  setLocation: (lat, lng) => set({ latitude: lat, longitude: lng, error: null }),
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
