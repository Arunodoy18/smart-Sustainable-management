'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCamera, useGeolocation } from '@/hooks';
import { wasteApi } from '@/lib/api';
import { WasteEntry } from '@/lib/types';
import { 
  Button, 
  Card, 
  ClassificationResultCard,
  LoadingSpinner 
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { 
  Camera, 
  SwitchCamera, 
  Upload, 
  X, 
  MapPin,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

type CaptureState = 'camera' | 'preview' | 'uploading' | 'result';

export default function CapturePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [captureState, setCaptureState] = useState<CaptureState>('camera');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<WasteEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    isSupported: cameraSupported,
    error: cameraError,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
  } = useCamera({ facingMode: 'environment' });

  const {
    isSupported: geoSupported,
    location,
    getLocation,
    loading: geoLoading,
  } = useGeolocation();

  // Start camera on mount
  useEffect(() => {
    if (cameraSupported) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get location on mount
  useEffect(() => {
    if (geoSupported) {
      getLocation();
    }
  }, [geoSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleCapture = () => {
    const file = captureImage();
    if (file) {
      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCaptureState('preview');
      stopCamera();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCaptureState('preview');
      stopCamera();
    }
  };

  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setCaptureState('camera');
    startCamera();
  };

  const handleSubmit = async () => {
    if (!capturedFile) return;

    setCaptureState('uploading');
    setError(null);

    try {
      const entry = await wasteApi.classify(capturedFile, location || undefined);
      setResult(entry);
      setCaptureState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed');
      setCaptureState('preview');
    }
  };

  const handleNewCapture = () => {
    handleRetake();
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Capture Waste</h1>
        <p className="text-gray-400 mt-1">
          Take a photo for AI-powered classification
        </p>
      </div>

      {/* Camera/Preview Container */}
      <div className="relative">
        {captureState === 'camera' && (
          <Card className="overflow-hidden">
            {/* Camera view */}
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
              {!cameraSupported ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-status-pending mb-4" />
                  <p className="text-white font-medium mb-2">Camera Not Available</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Your device doesn&apos;t support camera access. Please upload an image instead.
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              ) : cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-status-error mb-4" />
                  <p className="text-white font-medium mb-2">Camera Error</p>
                  <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
                  <div className="flex gap-3">
                    <Button onClick={startCamera} variant="secondary">
                      Try Again
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Upload Instead
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Camera overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner guides */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-eco-400 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-eco-400 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-eco-400 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-eco-400 rounded-br-lg" />
                  </div>

                  {/* Location indicator */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className={cn(
                        'w-4 h-4',
                        location ? 'text-eco-400' : 'text-gray-400'
                      )} />
                      <span className={location ? 'text-white' : 'text-gray-400'}>
                        {geoLoading ? 'Getting location...' : location ? 'Location acquired' : 'Location unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Switch camera button */}
                  <button
                    onClick={switchCamera}
                    aria-label="Switch camera"
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Camera controls */}
            {cameraSupported && !cameraError && (
              <div className="p-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-full bg-surface-hover text-gray-400 hover:text-white transition-colors"
                    title="Upload image"
                  >
                    <Upload className="w-6 h-6" />
                  </button>

                  <button
                    onClick={handleCapture}
                    className="w-16 h-16 rounded-full bg-eco-500 hover:bg-eco-600 flex items-center justify-center transition-all shadow-eco hover:shadow-eco-lg"
                    title="Capture"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </button>

                  <div className="w-12" /> {/* Spacer for alignment */}
                </div>
              </div>
            )}
          </Card>
        )}

        {captureState === 'preview' && previewUrl && (
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
              <img
                src={previewUrl}
                alt="Captured waste"
                className="w-full h-full object-cover"
              />

              {/* Retake button */}
              <button
                onClick={handleRetake}
                aria-label="Retake photo"
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Location indicator */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className={cn(
                    'w-4 h-4',
                    location ? 'text-eco-400' : 'text-gray-400'
                  )} />
                  <span className={location ? 'text-white' : 'text-gray-400'}>
                    {location ? 'Location attached' : 'No location'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-status-error/10 border-t border-status-error/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                  <p className="text-sm text-status-error">{error}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="p-4 flex gap-3">
              <Button
                variant="secondary"
                onClick={handleRetake}
                className="flex-1"
              >
                Retake
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            </div>
          </Card>
        )}

        {captureState === 'uploading' && (
          <Card className="py-16">
            <div className="flex flex-col items-center">
              <LoadingSpinner size="lg" />
              <p className="text-white font-medium mt-4">Analyzing waste...</p>
              <p className="text-gray-400 text-sm mt-1">AI is classifying your image</p>
            </div>
          </Card>
        )}

        {captureState === 'result' && result && (
          <div className="space-y-4">
            <ClassificationResultCard 
              entry={result} 
              showActions={false}
            />

            {/* Success indicator */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-green/10 border border-accent-green/20">
              <CheckCircle className="w-6 h-6 text-accent-green flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Pickup Request Created</p>
                <p className="text-sm text-gray-400">
                  A driver will be assigned to collect this item
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleNewCapture}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Another
              </Button>
              <Button
                onClick={handleViewHistory}
                className="flex-1"
              >
                View History
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        aria-label="Upload waste image"
        className="hidden"
      />

      {/* Tips section */}
      {captureState === 'camera' && (
        <Card className="mt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-eco-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Tips for best results</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Ensure good lighting on the waste item</li>
                <li>• Center the item in the frame</li>
                <li>• Capture only one item at a time</li>
                <li>• Keep the camera steady</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
