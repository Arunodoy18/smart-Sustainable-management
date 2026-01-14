'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GeoState, Location } from '@/lib/types';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGeolocationReturn extends Omit<GeoState, 'position'> {
  location: Location | null;
  getLocation: () => Promise<Location | null>;
  watchLocation: () => void;
  stopWatching: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const [state, setState] = useState<GeoState>({
    isSupported: false,
    hasPermission: null,
    position: null,
    error: null,
    loading: false,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  // Check if geolocation is supported
  useEffect(() => {
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    setState((prev) => ({ ...prev, isSupported }));
  }, []);

  const positionOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge,
  };

  const getLocation = useCallback(async (): Promise<Location | null> => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported on this device',
      }));
      return null;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setState((prev) => ({
            ...prev,
            position,
            hasPermission: true,
            loading: false,
            error: null,
          }));

          resolve(location);
        },
        (error) => {
          let friendlyMessage = error.message;
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              friendlyMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              friendlyMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              friendlyMessage = 'Location request timed out. Please try again.';
              break;
          }

          setState((prev) => ({
            ...prev,
            hasPermission: error.code !== error.PERMISSION_DENIED ? prev.hasPermission : false,
            loading: false,
            error: friendlyMessage,
          }));

          resolve(null);
        },
        positionOptions
      );
    });
  }, [state.isSupported, positionOptions]);

  const watchLocation = useCallback(() => {
    if (!state.isSupported || watchId !== null) {
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          position,
          hasPermission: true,
          error: null,
        }));
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          error: error.message,
        }));
      },
      positionOptions
    );

    setWatchId(id);
  }, [state.isSupported, watchId, positionOptions]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const location: Location | null = state.position
    ? {
        lat: state.position.coords.latitude,
        lng: state.position.coords.longitude,
      }
    : null;

  return {
    isSupported: state.isSupported,
    hasPermission: state.hasPermission,
    error: state.error,
    loading: state.loading,
    location,
    getLocation,
    watchLocation,
    stopWatching,
  };
}
