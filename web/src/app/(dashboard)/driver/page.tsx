'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRealtime, useGeolocation, useCamera } from '@/hooks';
import { wasteApi } from '@/lib/api';
import { WasteEntry } from '@/lib/types';
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent,
  Button,
  Badge,
  Skeleton
} from '@/components/ui';
import { MapComponent } from '@/components/map';
import { cn } from '@/lib/cn';
import { getWasteTypeInfo, formatRelativeTime } from '@/lib/utils';
import { 
  MapPin, 
  Navigation, 
  Camera, 
  CheckCircle,
  Clock,
  Truck,
  X,
  AlertCircle,
  Bell
} from 'lucide-react';

type DriverView = 'list' | 'pickup' | 'verify';

export default function DriverPage() {
  const { } = useAuth();
  const [pendingPickups, setPendingPickups] = useState<WasteEntry[]>([]);
  const [activePickup, setActivePickup] = useState<WasteEntry | null>(null);
  const [view, setView] = useState<DriverView>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geolocation for driver tracking
  const { 
    location: driverLocation, 
    watchLocation, 
    stopWatching,
    getLocation 
  } = useGeolocation();

  // Camera for proof capture
  const {
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureImage,
    isSupported: cameraSupported,
    error: cameraError,
  } = useCamera({ facingMode: 'environment' });

  // Real-time updates
  useRealtime({
    onNewPickup: (data) => {
      const newEntry = data as unknown as WasteEntry;
      setPendingPickups((prev) => [newEntry, ...prev]);
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Pickup Available', {
          body: `${getWasteTypeInfo(newEntry.waste_type).label} waste reported nearby`,
          icon: '/icon-192.png',
        });
      }
    },
    onPickupCollected: (data) => {
      const { entry_id } = data as { entry_id: string };
      setPendingPickups((prev) => prev.filter((e) => e.id !== entry_id));
    },
  });

  // Load pending pickups
  useEffect(() => {
    async function loadPickups() {
      try {
        const data = await wasteApi.getPending();
        setPendingPickups(data);
      } catch (error) {
        console.error('Failed to load pickups:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPickups();
    getLocation();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Watch location when on pickup view
  useEffect(() => {
    if (view === 'pickup' && activePickup) {
      watchLocation();
    } else {
      stopWatching();
    }

    return () => stopWatching();
  }, [view, activePickup]);

  const handleAcceptPickup = async (entry: WasteEntry) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await wasteApi.acceptPickup(entry.id);
      setActivePickup(updated);
      setView('pickup');
      setPendingPickups((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept pickup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartVerification = () => {
    setView('verify');
    if (cameraSupported) {
      startCamera();
    }
  };

  const handleCaptureProof = () => {
    const file = captureImage();
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const handleRetakeProof = () => {
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }
    setProofImage(null);
    setProofPreview(null);
    if (cameraSupported) {
      startCamera();
    }
  };

  const handleCompletePickup = async () => {
    if (!activePickup || !proofImage) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await wasteApi.collectPickup(
        activePickup.id,
        proofImage,
        driverLocation || undefined
      );
      
      // Reset state
      setActivePickup(null);
      setProofImage(null);
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
      }
      setProofPreview(null);
      setView('list');
      stopCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete pickup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPickup = () => {
    setActivePickup(null);
    setProofImage(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }
    setProofPreview(null);
    setView('list');
    stopCamera();
    // Refresh pickup list
    wasteApi.getPending().then(setPendingPickups);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Driver Dashboard</h1>
            <p className="text-gray-400 mt-1">
              {view === 'list' 
                ? 'Available pickups in your area' 
                : view === 'pickup'
                ? 'Navigate to pickup location'
                : 'Verify collection'
              }
            </p>
          </div>
          
          {view !== 'list' && (
            <Button 
              variant="ghost" 
              onClick={handleCancelPickup}
              className="text-gray-400"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
          <p className="text-sm text-status-error">{error}</p>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="eco-gradient">
              <CardContent className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-status-pending/20 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-status-pending" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{pendingPickups.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="eco-gradient">
              <CardContent className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-eco-500/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-eco-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-sm font-medium text-white truncate">
                    {driverLocation ? 'Tracking' : 'Unknown'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pickup list */}
          <Card>
            <CardHeader>
              <CardTitle>Nearby Pickups</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : pendingPickups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400">No pending pickups available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    New pickups will appear here in real-time
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPickups.map((entry) => {
                    const wasteInfo = getWasteTypeInfo(entry.waste_type);
                    
                    return (
                      <div
                        key={entry.id}
                        className="p-4 rounded-xl bg-background-secondary border border-surface-hover hover:border-eco-500/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                            {entry.image_url ? (
                              <img
                                src={entry.image_url}
                                alt="Waste"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">
                                {wasteInfo.icon}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('font-medium', wasteInfo.color)}>
                                {wasteInfo.label}
                              </span>
                              <Badge variant="warning" size="sm">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-400 truncate mb-2">
                              {entry.recommended_action}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(entry.created_at)}
                              </span>
                              
                              {entry.location && (
                                <span className="text-xs text-eco-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Location available
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Accept button */}
                          <Button
                            size="sm"
                            onClick={() => handleAcceptPickup(entry)}
                            disabled={isSubmitting}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pickup View (Navigation) */}
      {view === 'pickup' && activePickup && (
        <div className="space-y-4">
          {/* Pickup info */}
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                {activePickup.image_url ? (
                  <img
                    src={activePickup.image_url}
                    alt="Waste"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {getWasteTypeInfo(activePickup.waste_type).icon}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">
                  {getWasteTypeInfo(activePickup.waste_type).label} Pickup
                </h3>
                <p className="text-sm text-gray-400">
                  {activePickup.collection_type}
                </p>
              </div>
              <Badge variant="info">
                <Navigation className="w-3 h-3 mr-1" />
                In Transit
              </Badge>
            </CardContent>
          </Card>

          {/* Map */}
          <MapComponent
            pickupLocation={activePickup.location}
            driverLocation={driverLocation}
            className="h-80 rounded-xl"
          />

          {/* Instructions */}
          <Card>
            <CardContent>
              <h4 className="font-medium text-white mb-3">Pickup Instructions</h4>
              <ul className="space-y-2">
                {activePickup.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-eco-400 mt-0.5 flex-shrink-0" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Arrived button */}
          <Button 
            size="lg" 
            className="w-full"
            onClick={handleStartVerification}
          >
            <Camera className="w-5 h-5 mr-2" />
            I&apos;ve Arrived - Verify Pickup
          </Button>
        </div>
      )}

      {/* Verification View */}
      {view === 'verify' && activePickup && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capture Proof of Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
                {!proofPreview ? (
                  <>
                    {!cameraSupported || cameraError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-status-pending mb-4" />
                        <p className="text-white font-medium mb-2">Camera Not Available</p>
                        <p className="text-gray-400 text-sm mb-4">
                          {cameraError || 'Please upload an image instead'}
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Upload Image
                        </Button>
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
                      </>
                    )}
                  </>
                ) : (
                  <img
                    src={proofPreview}
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Controls */}
              <div className="mt-4 flex gap-3">
                {!proofPreview ? (
                  <>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload
                    </Button>
                    {cameraSupported && !cameraError && (
                      <Button
                        className="flex-1"
                        onClick={handleCaptureProof}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={handleRetakeProof}
                    >
                      Retake
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCompletePickup}
                      isLoading={isSubmitting}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reference image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Original Waste Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden bg-background-tertiary">
                {activePickup.image_url ? (
                  <img
                    src={activePickup.image_url}
                    alt="Original waste"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {getWasteTypeInfo(activePickup.waste_type).icon}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        aria-label="Upload verification photo"
        className="hidden"
      />
    </div>
  );
}
