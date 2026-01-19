/**
 * Admin Drivers Page
 * ==================
 * 
 * Driver management for administrators.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  TruckIcon,
  StarIcon,
  MapPinIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

import { api, cn, formatDate } from '@/lib';
import { Card, Button, Input, Badge, Avatar, Modal, Spinner, EmptyState } from '@/components/ui';
import type { User, UserStatus } from '@/types';

interface Driver extends User {
  driver_profile?: {
    vehicle_type: string;
    license_number: string;
    zone: string;
    total_pickups: number;
    rating: number;
    is_available: boolean;
  };
}

const STATUS_VARIANTS: Record<UserStatus, 'success' | 'secondary' | 'danger'> = {
  active: 'success',
  inactive: 'secondary',
  suspended: 'danger',
};

export function AdminDriversPage() {
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'busy'>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch drivers
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['admin', 'drivers', availabilityFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (availabilityFilter !== 'all') params.append('availability', availabilityFilter);
      if (search) params.append('search', search);
      
      const { data } = await api.get<Driver[]>(`/admin/drivers?${params}`);
      return data;
    },
  });

  // Toggle availability mutation
  const toggleAvailability = useMutation({
    mutationFn: async ({ driverId, available }: { driverId: string; available: boolean }) => {
      await api.patch(`/admin/drivers/${driverId}/availability`, { is_available: available });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
    },
  });

  // Mock data for demo
  const mockDrivers: Driver[] = [
    {
      id: '1',
      email: 'alex@driver.com',
      first_name: 'Alex',
      last_name: 'Johnson',
      role: 'driver',
      status: 'active',
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      driver_profile: {
        vehicle_type: 'Pickup Truck',
        license_number: 'DL-123456',
        zone: 'Zone A - Downtown',
        total_pickups: 342,
        rating: 4.8,
        is_available: true,
      },
    },
    {
      id: '2',
      email: 'maria@driver.com',
      first_name: 'Maria',
      last_name: 'Garcia',
      role: 'driver',
      status: 'active',
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      driver_profile: {
        vehicle_type: 'Van',
        license_number: 'DL-789012',
        zone: 'Zone B - Suburbs',
        total_pickups: 256,
        rating: 4.9,
        is_available: true,
      },
    },
    {
      id: '3',
      email: 'james@driver.com',
      first_name: 'James',
      last_name: 'Wilson',
      role: 'driver',
      status: 'active',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      driver_profile: {
        vehicle_type: 'Large Truck',
        license_number: 'DL-345678',
        zone: 'Zone C - Industrial',
        total_pickups: 189,
        rating: 4.6,
        is_available: false,
      },
    },
  ];

  const displayDrivers = drivers || mockDrivers;

  const availableCount = displayDrivers.filter((d) => d.driver_profile?.is_available).length;
  const totalPickups = displayDrivers.reduce((sum, d) => sum + (d.driver_profile?.total_pickups || 0), 0);
  const avgRating = displayDrivers.reduce((sum, d) => sum + (d.driver_profile?.rating || 0), 0) / displayDrivers.length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
          <p className="mt-1 text-gray-600">
            Manage and monitor waste collection drivers
          </p>
        </div>
        <Button leftIcon={<UserPlusIcon className="h-5 w-5" />}>
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">{displayDrivers.length}</p>
          <p className="text-sm text-gray-500">Total Drivers</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{availableCount}</p>
          <p className="text-sm text-gray-500">Available Now</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-yellow-600">{avgRating.toFixed(1)} ⭐</p>
          <p className="text-sm text-gray-500">Average Rating</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search drivers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'available', 'busy'] as const).map((filter) => (
              <Button
                key={filter}
                variant={availabilityFilter === filter ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setAvailabilityFilter(filter)}
              >
                {filter === 'all' ? 'All' : filter === 'available' ? 'Available' : 'Busy'}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Drivers Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : displayDrivers.length === 0 ? (
        <EmptyState
          icon={<TruckIcon className="h-12 w-12" />}
          title="No drivers found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayDrivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedDriver(driver)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={driver.avatar_url}
                      name={`${driver.first_name} ${driver.last_name}`}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {driver.first_name} {driver.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{driver.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant={driver.driver_profile?.is_available ? 'success' : 'secondary'}
                    size="sm"
                    dot
                  >
                    {driver.driver_profile?.is_available ? 'Available' : 'Busy'}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <TruckIcon className="h-4 w-4" />
                    <span>{driver.driver_profile?.vehicle_type || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{driver.driver_profile?.zone || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <StarIcon className="h-4 w-4" />
                    <span>
                      {driver.driver_profile?.rating?.toFixed(1) || '0.0'} ({driver.driver_profile?.total_pickups || 0} pickups)
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAvailability.mutate({
                        driverId: driver.id,
                        available: !driver.driver_profile?.is_available,
                      });
                    }}
                  >
                    {driver.driver_profile?.is_available ? 'Set Busy' : 'Set Available'}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDriver(driver);
                      setShowAssignModal(true);
                    }}
                  >
                    Assign
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Driver Details Modal */}
      <Modal
        isOpen={!!selectedDriver && !showAssignModal}
        onClose={() => setSelectedDriver(null)}
        title="Driver Details"
        size="lg"
      >
        {selectedDriver && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={selectedDriver.avatar_url}
                name={`${selectedDriver.first_name} ${selectedDriver.last_name}`}
                size="xl"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedDriver.first_name} {selectedDriver.last_name}
                </h3>
                <p className="text-gray-500">{selectedDriver.email}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant={STATUS_VARIANTS[selectedDriver.status]} size="sm">
                    {selectedDriver.status}
                  </Badge>
                  <Badge
                    variant={selectedDriver.driver_profile?.is_available ? 'success' : 'secondary'}
                    size="sm"
                    dot
                  >
                    {selectedDriver.driver_profile?.is_available ? 'Available' : 'Busy'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Vehicle Type
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedDriver.driver_profile?.vehicle_type || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  License Number
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedDriver.driver_profile?.license_number || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Assigned Zone
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedDriver.driver_profile?.zone || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total Pickups
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedDriver.driver_profile?.total_pickups || 0}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Driver Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedDriver.driver_profile?.rating?.toFixed(1) || '0.0'} ⭐
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedDriver.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedDriver(null)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => setShowAssignModal(true)}
                className="flex-1"
              >
                Assign Zone
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Zone Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedDriver(null);
        }}
        title="Assign Zone"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Assign <strong>{selectedDriver?.first_name} {selectedDriver?.last_name}</strong> to a zone
          </p>
          <div className="space-y-2">
            {['Zone A - Downtown', 'Zone B - Suburbs', 'Zone C - Industrial', 'Zone D - Residential'].map((zone) => (
              <button
                key={zone}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border p-3 transition-colors',
                  selectedDriver?.driver_profile?.zone === zone
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <span className="font-medium">{zone}</span>
                {selectedDriver?.driver_profile?.zone === zone && (
                  <Badge variant="success" size="sm">Current</Badge>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button className="flex-1">
              Assign Zone
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
