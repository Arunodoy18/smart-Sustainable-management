/**
 * Driver Pickups Page
 * ===================
 * 
 * List and manage assigned pickups.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CheckIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { api, cn, formatDate } from '@/lib';
import { Card, Button, Badge, Modal, Spinner, EmptyState } from '@/components/ui';
import type { Pickup, PickupStatus } from '@/types';

const STATUS_CONFIG: Record<PickupStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  assigned: { label: 'Assigned', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

export function DriverPickupsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  const queryClient = useQueryClient();

  // Fetch assigned pickups
  const { data: pickups, isLoading } = useQuery({
    queryKey: ['driver', 'pickups'],
    queryFn: async () => {
      const { data } = await api.get<Pickup[]>('/pickups/driver/assigned');
      return data;
    },
  });

  // Start pickup mutation
  const startPickup = useMutation({
    mutationFn: async (pickupId: string) => {
      await api.post(`/pickups/driver/${pickupId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'pickups'] });
      setSelectedPickup(null);
    },
  });

  // Complete pickup mutation
  const completePickup = useMutation({
    mutationFn: async (pickupId: string) => {
      await api.post(`/pickups/driver/${pickupId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'pickups'] });
      setSelectedPickup(null);
    },
  });

  const assignedPickups = pickups?.filter((p) => p.status === 'assigned') || [];
  const inProgressPickups = pickups?.filter((p) => p.status === 'in_progress') || [];
  const completedPickups = pickups?.filter((p) => p.status === 'completed') || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Pickups</h1>
        <p className="mt-1 text-gray-600">
          Manage your assigned waste collection pickups
        </p>
      </div>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
          {[
            { label: 'Assigned', count: assignedPickups.length },
            { label: 'In Progress', count: inProgressPickups.length },
            { label: 'Completed', count: completedPickups.length },
          ].map((tab) => (
            <Tab
              key={tab.label}
              className={({ selected }) =>
                cn(
                  'flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors',
                  selected
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )
              }
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {/* Assigned */}
          <Tab.Panel>
            {assignedPickups.length === 0 ? (
              <EmptyState
                icon={<TruckIcon className="h-12 w-12" />}
                title="No assigned pickups"
                description="New pickups will appear here when assigned to you"
              />
            ) : (
              <div className="space-y-4">
                {assignedPickups.map((pickup, index) => (
                  <PickupCard
                    key={pickup.id}
                    pickup={pickup}
                    index={index}
                    onSelect={() => setSelectedPickup(pickup)}
                    actionButton={
                      <Button
                        size="sm"
                        leftIcon={<PlayIcon className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          startPickup.mutate(pickup.id);
                        }}
                        loading={startPickup.isPending}
                      >
                        Start
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* In Progress */}
          <Tab.Panel>
            {inProgressPickups.length === 0 ? (
              <EmptyState
                icon={<TruckIcon className="h-12 w-12" />}
                title="No pickups in progress"
                description="Start an assigned pickup to see it here"
              />
            ) : (
              <div className="space-y-4">
                {inProgressPickups.map((pickup, index) => (
                  <PickupCard
                    key={pickup.id}
                    pickup={pickup}
                    index={index}
                    onSelect={() => setSelectedPickup(pickup)}
                    actionButton={
                      <Button
                        size="sm"
                        variant="success"
                        leftIcon={<CheckIcon className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          completePickup.mutate(pickup.id);
                        }}
                        loading={completePickup.isPending}
                      >
                        Complete
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* Completed */}
          <Tab.Panel>
            {completedPickups.length === 0 ? (
              <EmptyState
                icon={<CheckIcon className="h-12 w-12" />}
                title="No completed pickups"
                description="Your completed pickups will appear here"
              />
            ) : (
              <div className="space-y-4">
                {completedPickups.map((pickup, index) => (
                  <PickupCard
                    key={pickup.id}
                    pickup={pickup}
                    index={index}
                    onSelect={() => setSelectedPickup(pickup)}
                  />
                ))}
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Pickup Detail Modal */}
      <Modal
        isOpen={!!selectedPickup}
        onClose={() => setSelectedPickup(null)}
        title="Pickup Details"
        size="lg"
      >
        {selectedPickup && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge variant={STATUS_CONFIG[selectedPickup.status].variant} size="lg">
                {STATUS_CONFIG[selectedPickup.status].label}
              </Badge>
              <span className="text-sm text-gray-500">
                ID: {selectedPickup.id.slice(0, 8)}...
              </span>
            </div>

            {/* Address */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Pickup Address
              </p>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {selectedPickup.address}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(selectedPickup.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                <MapPinIcon className="h-4 w-4" />
                Open in Maps
              </a>
            </div>

            {/* Customer Info */}
            {selectedPickup.citizen && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Customer
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    {selectedPickup.citizen.first_name} {selectedPickup.citizen.last_name}
                  </p>
                  {selectedPickup.citizen.phone && (
                    <a
                      href={`tel:${selectedPickup.citizen.phone}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600"
                    >
                      <PhoneIcon className="h-4 w-4" />
                      Call
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Scheduled Date
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {selectedPickup.scheduled_date
                    ? formatDate(selectedPickup.scheduled_date)
                    : formatDate(selectedPickup.preferred_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Time Slot
                </p>
                <p className="mt-1 font-medium capitalize text-gray-900">
                  {selectedPickup.preferred_time_slot.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Waste Types */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Waste Types
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPickup.waste_types?.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-gray-700"
                  >
                    {type.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedPickup.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Notes
                </p>
                <p className="mt-1 text-gray-700">{selectedPickup.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 border-t border-gray-200 pt-4">
              {selectedPickup.status === 'assigned' && (
                <Button
                  className="flex-1"
                  leftIcon={<PlayIcon className="h-5 w-5" />}
                  onClick={() => startPickup.mutate(selectedPickup.id)}
                  loading={startPickup.isPending}
                >
                  Start Pickup
                </Button>
              )}
              {selectedPickup.status === 'in_progress' && (
                <Button
                  className="flex-1"
                  variant="success"
                  leftIcon={<CheckIcon className="h-5 w-5" />}
                  onClick={() => completePickup.mutate(selectedPickup.id)}
                  loading={completePickup.isPending}
                >
                  Mark Complete
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedPickup(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Pickup Card Component
function PickupCard({
  pickup,
  index,
  onSelect,
  actionButton,
}: {
  pickup: Pickup;
  index: number;
  onSelect: () => void;
  actionButton?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={onSelect}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-600">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-gray-900">{pickup.address}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {pickup.preferred_time_slot.replace('_', ' ')}
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant={STATUS_CONFIG[pickup.status].variant} size="sm">
                    {STATUS_CONFIG[pickup.status].label}
                  </Badge>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {pickup.waste_types?.slice(0, 3).map((type) => (
                  <span
                    key={type}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {actionButton && (
            <div onClick={(e) => e.stopPropagation()}>{actionButton}</div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
