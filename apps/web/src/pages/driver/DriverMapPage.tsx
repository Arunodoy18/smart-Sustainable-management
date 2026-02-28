/**
 * Driver Map Page
 * ===============
 * 
 * Interactive map for route navigation.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import {
  ArrowLeftIcon,
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

import { api, cn } from '@/lib';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { useLocationStore } from '@/stores';
import type { Pickup, PickupStatus } from '@/types';

import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const activeIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const STATUS_CONFIG: Record<PickupStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' }> = {
  REQUESTED: { label: 'Requested', variant: 'warning' },
  ASSIGNED: { label: 'Assigned', variant: 'default' },
  EN_ROUTE: { label: 'En Route', variant: 'default' },
  ARRIVED: { label: 'Arrived', variant: 'success' },
  COLLECTED: { label: 'Collected', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

// Component to update map center
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export function DriverMapPage() {
  const [showList, setShowList] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const { currentLocation, setCurrentLocation } = useLocationStore();

  // Fetch assigned pickups
  const { data: pickups, isLoading } = useQuery({
    queryKey: ['driver', 'pickups'],
    queryFn: async () => {
      const { data } = await api.get<Pickup[]>('/api/v1/pickups/driver/assigned');
      return data;
    },
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to a location if geolocation fails
          setCurrentLocation({ lat: 40.7128, lng: -74.006 });
        }
      );
    }
  }, [setCurrentLocation]);

  const activePickups = pickups?.filter((p) => ['ASSIGNED', 'EN_ROUTE'].includes(p.status)) || [];

  // Use real coordinates from pickup data; fall back to offset from driver location
  const getPickupCoordinates = (pickup: Pickup, index: number): [number, number] => {
    if (pickup.latitude != null && pickup.longitude != null) {
      return [pickup.latitude, pickup.longitude];
    }
    // Fallback: spread around current location (only when backend has no coords)
    const baseLat = currentLocation?.lat || 40.7128;
    const baseLng = currentLocation?.lng || -74.006;
    const offset = 0.02;
    return [
      baseLat + (Math.sin(index * 1.5) * offset),
      baseLng + (Math.cos(index * 1.5) * offset),
    ];
  };

  const center: [number, number] = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [40.7128, -74.006];

  if (isLoading || !currentLocation) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center justify-between">
        <Link to="/driver">
          <Button variant="outline" size="sm" className="bg-white shadow-lg">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
          leftIcon={<ListBulletIcon className="h-4 w-4" />}
          onClick={() => setShowList(!showList)}
        >
          {activePickups.length} Pickups
        </Button>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full rounded-lg"
        style={{ zIndex: 0 }}
      >
        <MapController center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current location marker */}
        <Marker
          position={[currentLocation.lat, currentLocation.lng]}
          icon={new Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Your Location</p>
            </div>
          </Popup>
        </Marker>

        {/* Pickup markers */}
        {activePickups.map((pickup, index) => {
          const coords = getPickupCoordinates(pickup, index);
          const isSelected = selectedPickup === pickup.id;
          return (
            <Marker
              key={pickup.id}
              position={coords}
              icon={pickup.status === 'EN_ROUTE' ? activeIcon : defaultIcon}
              eventHandlers={{
                click: () => setSelectedPickup(pickup.id),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <Badge variant={STATUS_CONFIG[pickup.status].variant} size="sm">
                    {STATUS_CONFIG[pickup.status].label}
                  </Badge>
                  <p className="mt-2 font-semibold">{pickup.address}</p>
                  <p className="text-sm text-gray-500">
                    {pickup.scheduled_time_start || 'Flexible'}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <Badge variant={pickup.priority === 'HIGH' ? 'danger' : 'default'} size="sm">
                      {pickup.priority}
                    </Badge>
                  </div>
                  <a
                    href={`https://maps.google.com/maps?daddr=${encodeURIComponent(pickup.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-center text-sm font-medium text-primary-600"
                  >
                    Get Directions
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route line (simplified - in production use routing API) */}
        {activePickups.length > 1 && (
          <Polyline
            positions={[
              [currentLocation.lat, currentLocation.lng],
              ...activePickups.map((p, i) => getPickupCoordinates(p, i)),
            ]}
            color="#10b981"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Pickup List Sidebar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-[1000] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out rounded-t-2xl',
          showList ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'
        )}
        style={{ maxHeight: '60vh' }}
      >
        {/* Handle */}
        <div
          className="flex cursor-pointer items-center justify-center py-3"
          onClick={() => setShowList(!showList)}
        >
          <div className="h-1 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 pb-3">
          <h3 className="font-semibold text-gray-900">
            Today's Route ({activePickups.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowList(!showList)}
          >
            {showList ? 'Hide' : 'Show'}
          </Button>
        </div>

        {/* List */}
        <div className="max-h-[40vh] overflow-y-auto p-4">
          {activePickups.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No pickups assigned</p>
          ) : (
            <div className="space-y-3">
              {activePickups.map((pickup, index) => (
                <div
                  key={pickup.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    selectedPickup === pickup.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                  onClick={() => setSelectedPickup(pickup.id)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-600 text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {pickup.address}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      {pickup.scheduled_time_start || 'Flexible'}
                      <Badge variant={STATUS_CONFIG[pickup.status].variant} size="sm">
                        {STATUS_CONFIG[pickup.status].label}
                      </Badge>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/maps?daddr=${encodeURIComponent(pickup.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-primary-100 p-2 text-primary-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPinIcon className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
