/**
 * Camera Capture Component
 * =========================
 * 
 * Multi-device camera capture with automatic fallback:
 * - Mobile back camera (preferred for waste photos)
 * - Mobile front camera
 * - Laptop webcam
 * - File upload fallback
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  CameraIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Button } from './ui';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        setError('No camera found on this device');
        return [];
      }

      setCameras(videoDevices);
      
      // Try to start with back camera (mobile) or first available
      const backCameraIndex = videoDevices.findIndex(
        device => device.label.toLowerCase().includes('back') || 
                  device.label.toLowerCase().includes('rear') ||
                  device.label.toLowerCase().includes('environment')
      );
      
      setCurrentCameraIndex(backCameraIndex >= 0 ? backCameraIndex : 0);
      return videoDevices;
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setError('Unable to access cameras');
      return [];
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: 'environment', // Try back camera first on mobile
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      // Provide user-friendly error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please check your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Unable to access camera. Please try again.');
      }
      
      setIsLoading(false);
    }
  }, [stream]);

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      const devices = await enumerateCameras();
      if (devices.length > 0) {
        await startCamera(devices[currentCameraIndex]?.deviceId);
      } else {
        setIsLoading(false);
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Switch camera
  const switchCamera = async () => {
    if (cameras.length <= 1) return;

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startCamera(cameras[nextIndex].deviceId);
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (!blob) return;

      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageUrl);
      
      // Stop camera stream after capture
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }, 'image/jpeg', 0.9);
  };

  // Confirm captured image
  const confirmCapture = () => {
    if (!canvasRef.current || !capturedImage) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File(
        [blob],
        `waste-photo-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );
      
      onCapture(file);
    }, 'image/jpeg', 0.9);
  };

  // Retake photo
  const retakePhoto = async () => {
    setCapturedImage(null);
    await startCamera(cameras[currentCameraIndex]?.deviceId);
  };

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onCapture(file);
    }
  };

  // Render error state with file upload fallback
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-4">
          <XMarkIcon className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Camera Unavailable</h3>
        <p className="mb-6 text-sm text-gray-600">{error}</p>
        
        <div className="space-y-3">
          <Button onClick={() => window.location.reload()} variant="secondary">
            Retry Camera Access
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <Button variant="outline" leftIcon={<PhotoIcon className="h-5 w-5" />}>
              Upload Photo Instead
            </Button>
          </div>
          
          {onCancel && (
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Camera View or Captured Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="h-full w-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-white text-sm">Loading camera...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {capturedImage ? (
          <>
            <Button onClick={retakePhoto} variant="secondary" size="lg">
              <XMarkIcon className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button onClick={confirmCapture} size="lg">
              <CheckIcon className="h-5 w-5 mr-2" />
              Use Photo
            </Button>
          </>
        ) : (
          <>
            {onCancel && (
              <Button onClick={onCancel} variant="ghost" size="lg">
                Cancel
              </Button>
            )}
            
            {cameras.length > 1 && (
              <Button
                onClick={switchCamera}
                variant="secondary"
                size="lg"
                leftIcon={<ArrowPathIcon className="h-5 w-5" />}
              >
                Switch
              </Button>
            )}
            
            <Button
              onClick={capturePhoto}
              disabled={isLoading}
              size="lg"
              className="px-8"
            >
              <CameraIcon className="h-6 w-6 mr-2" />
              Capture
            </Button>
          </>
        )}
      </div>

      {/* Camera Info */}
      {!capturedImage && cameras.length > 0 && (
        <p className="mt-2 text-center text-sm text-gray-500">
          Using: {cameras[currentCameraIndex]?.label || 'Camera'}
        </p>
      )}
    </div>
  );
}
