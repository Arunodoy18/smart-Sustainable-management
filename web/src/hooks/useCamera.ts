'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CameraState } from '@/lib/types';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

interface UseCameraReturn extends CameraState {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => File | null;
  switchCamera: () => Promise<void>;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    facingMode = 'environment', // Default to back camera for waste capture
    width = 1280,
    height = 720,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>({
    isSupported: false,
    hasPermission: null,
    stream: null,
    error: null,
  });

  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode);

  // Check if camera is supported
  useEffect(() => {
    const isSupported = !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
    setState((prev) => ({ ...prev, isSupported }));
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({ ...prev, stream: null }));
  }, []);

  const startCamera = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Camera is not supported on this device',
      }));
      return;
    }

    // Stop existing stream first
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState((prev) => ({
        ...prev,
        stream,
        hasPermission: true,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission')) {
        friendlyMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (errorMessage.includes('NotFoundError')) {
        friendlyMessage = 'No camera found on this device.';
      } else if (errorMessage.includes('NotReadableError')) {
        friendlyMessage = 'Camera is already in use by another application.';
      }

      setState((prev) => ({
        ...prev,
        hasPermission: false,
        error: friendlyMessage,
      }));
    }
  }, [state.isSupported, currentFacingMode, width, height, stopCamera]);

  const switchCamera = useCallback(async () => {
    const newMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    setCurrentFacingMode(newMode);
  }, [currentFacingMode]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (streamRef.current) {
      startCamera();
    }
  }, [currentFacingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const captureImage = useCallback((): File | null => {
    if (!videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create file
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeType = 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeType });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new File([blob], `waste-capture-${timestamp}.jpg`, { type: mimeType });

    return file;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    ...state,
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
  };
}
