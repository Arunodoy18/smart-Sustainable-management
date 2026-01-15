'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { config } from '@/lib/config';
import type { Location } from '@/lib/types';
import { cn } from '@/lib/cn';
import { LoadingSpinner } from '@/components/ui';

interface MapComponentProps {
  pickupLocation?: Location | null;
  driverLocation?: Location | null;
  onDirectionsClick?: () => void;
  className?: string;
}

export function MapComponent({ 
  pickupLocation, 
  driverLocation,
  onDirectionsClick,
  className 
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!config.googleMapsApiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    const loader = new Loader({
      apiKey: config.googleMapsApiKey,
      version: 'weekly',
    });

    loader
      .load()
      .then(() => {
        if (mapRef.current && !mapInstanceRef.current) {
          const defaultCenter = driverLocation || pickupLocation || { lat: 0, lng: 0 };
          
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 14,
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError('Failed to load map');
      });
  }, []);

  // Update pickup marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (pickupLocation) {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setPosition(pickupLocation);
      } else {
        pickupMarkerRef.current = new google.maps.Marker({
          position: pickupLocation,
          map: mapInstanceRef.current,
          title: 'Pickup Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }
  }, [pickupLocation, isLoaded]);

  // Update driver marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (driverLocation) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setPosition(driverLocation);
      } else {
        driverMarkerRef.current = new google.maps.Marker({
          position: driverLocation,
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: 0,
          },
        });
      }

      // Center map on driver location
      mapInstanceRef.current.panTo(driverLocation);
    }
  }, [driverLocation, isLoaded]);

  // Fit bounds when both locations are available
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (pickupLocation && driverLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickupLocation);
      bounds.extend(driverLocation);
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [pickupLocation, driverLocation, isLoaded]);

  const handleNavigate = useCallback(() => {
    if (!pickupLocation) return;

    // Open Google Maps with navigation intent
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pickupLocation.lat},${pickupLocation.lng}&travelmode=driving`;
    window.open(url, '_blank');
    
    onDirectionsClick?.();
  }, [pickupLocation, onDirectionsClick]);

  if (error) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-surface rounded-xl',
        className
      )}>
        <div className="text-center p-6">
          <p className="text-gray-400">{error}</p>
          {pickupLocation && (
            <button
              onClick={handleNavigate}
              className="mt-4 px-4 py-2 bg-eco-500 text-white rounded-lg hover:bg-eco-600 transition-colors"
            >
              Open in Google Maps
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-xl overflow-hidden"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface rounded-xl">
          <LoadingSpinner />
        </div>
      )}

      {/* Navigate button */}
      {isLoaded && pickupLocation && (
        <button
          onClick={handleNavigate}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-eco-500 text-white rounded-xl font-medium shadow-eco hover:bg-eco-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Navigate
        </button>
      )}
    </div>
  );
}

// Dark theme map styles
const mapStyles: google.maps.MapTypeStyle[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1a2027' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a2027' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2a3542' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a2027' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#364454' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d3d47' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1e2730' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1a3025' }],
  },
];
