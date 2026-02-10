/**
 * Pickups Page
 * ============
 * 
 * Manage pickup requests and track scheduled pickups.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import { api, cn, formatDate } from '@/lib';
import { Card, Button, Badge, Input, Modal, EmptyState, Spinner } from '@/components/ui';
import type { Pickup, PickupStatus, PaginatedResponse, WasteEntry } from '@/types';

const pickupSchema = z.object({
  waste_entry_id: z.string().min(1, 'Please select a waste entry'),
  address: z.string().min(10, 'Please enter a complete address'),
  address_details: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  scheduled_date: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

type PickupFormData = z.infer<typeof pickupSchema>;

const STATUS_CONFIG: Record<PickupStatus, { label: string; color: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' }> = {
  REQUESTED: { label: 'Requested', color: 'bg-yellow-100 text-yellow-700', variant: 'warning' },
  ASSIGNED: { label: 'Assigned', color: 'bg-blue-100 text-blue-700', variant: 'default' },
  EN_ROUTE: { label: 'En Route', color: 'bg-blue-100 text-blue-700', variant: 'default' },
  ARRIVED: { label: 'Arrived', color: 'bg-green-100 text-green-700', variant: 'success' },
  COLLECTED: { label: 'Collected', color: 'bg-green-100 text-green-700', variant: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', variant: 'secondary' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700', variant: 'danger' },
};

export function PickupsPage() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const queryClient = useQueryClient();

  // Fetch pickups - backend returns PaginatedResponse
  const { data: pickupsData, isLoading } = useQuery({
    queryKey: ['pickups'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Pickup>>('/api/v1/pickups/my-pickups');
      return data;
    },
  });

  const pickups = pickupsData?.items || [];

  // Fetch waste entries to let user pick one for pickup request
  const { data: wasteEntriesData } = useQuery({
    queryKey: ['waste-entries-for-pickup'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<WasteEntry>>('/api/v1/waste/history?page_size=50');
      return data;
    },
    enabled: showRequestModal,
  });

  const availableEntries = (wasteEntriesData?.items || []).filter(
    (entry) => entry.status === 'CLASSIFIED' && entry.category
  );

  // Create pickup mutation
  const createPickup = useMutation({
    mutationFn: async (data: PickupFormData) => {
      const { data: result } = await api.post('/api/v1/pickups/request', {
        waste_entry_id: data.waste_entry_id,
        address: data.address,
        address_details: data.address_details || null,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        scheduled_date: data.scheduled_date || null,
        priority: data.priority || 'NORMAL',
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      queryClient.invalidateQueries({ queryKey: ['waste-entries-for-pickup'] });
      setShowRequestModal(false);
    },
  });

  // Cancel pickup mutation
  const cancelPickup = useMutation({
    mutationFn: async (pickupId: string) => {
      await api.post(`/api/v1/pickups/${pickupId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PickupFormData>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      priority: 'NORMAL',
      latitude: 0,
      longitude: 0,
    },
  });

  const onSubmit = (data: PickupFormData) => {
    createPickup.mutate(data);
  };

  const activePickups = pickups.filter((p) => ['REQUESTED', 'ASSIGNED', 'EN_ROUTE'].includes(p.status));
  const completedPickups = pickups.filter((p) => p.status === 'COLLECTED');
  const cancelledPickups = pickups.filter((p) => p.status === 'CANCELLED');

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Requests</h1>
          <p className="mt-1 text-gray-600">
            Schedule waste collection at your location
          </p>
        </div>
        <Button
          leftIcon={<PlusIcon className="h-5 w-5" />}
          onClick={() => {
            reset();
            setShowRequestModal(true);
          }}
        >
          Request Pickup
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
            {[
              { label: 'Active', count: activePickups.length },
              { label: 'Completed', count: completedPickups.length },
              { label: 'Cancelled', count: cancelledPickups.length },
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
            {/* Active Pickups */}
            <Tab.Panel>
              {activePickups.length === 0 ? (
                <EmptyState
                  icon={<TruckIcon className="h-12 w-12" />}
                  title="No active pickups"
                  description="Request a pickup to have your waste collected"
                  action={{
                    label: 'Request Pickup',
                    onClick: () => setShowRequestModal(true),
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {activePickups.map((pickup, index) => (
                    <PickupCard
                      key={pickup.id}
                      pickup={pickup}
                      index={index}
                      onCancel={() => cancelPickup.mutate(pickup.id)}
                      isCancelling={cancelPickup.isPending}
                    />
                  ))}
                </div>
              )}
            </Tab.Panel>

            {/* Completed */}
            <Tab.Panel>
              {completedPickups.length === 0 ? (
                <EmptyState
                  icon={<CheckCircleIcon className="h-12 w-12" />}
                  title="No completed pickups"
                  description="Your completed pickups will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {completedPickups.map((pickup, index) => (
                    <PickupCard key={pickup.id} pickup={pickup} index={index} />
                  ))}
                </div>
              )}
            </Tab.Panel>

            {/* Cancelled */}
            <Tab.Panel>
              {cancelledPickups.length === 0 ? (
                <EmptyState
                  icon={<TruckIcon className="h-12 w-12" />}
                  title="No cancelled pickups"
                  description="Cancelled pickups will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {cancelledPickups.map((pickup, index) => (
                    <PickupCard key={pickup.id} pickup={pickup} index={index} />
                  ))}
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      )}

      {/* Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Pickup"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Select Waste Entry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waste Entry
            </label>
            {availableEntries.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                No classified waste entries available. Upload and classify waste first.
              </p>
            ) : (
              <select
                {...register('waste_entry_id')}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select a waste entry...</option>
                {availableEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.category || 'Unknown'} — {new Date(entry.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            )}
            {errors.waste_entry_id && (
              <p className="mt-1 text-sm text-red-600">{errors.waste_entry_id.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pickup Address
            </label>
            <Input
              {...register('address')}
              placeholder="Enter your full address"
              error={errors.address?.message}
              leftIcon={<MapPinIcon className="h-5 w-5" />}
              className="mt-1"
            />
          </div>

          {/* Address Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address Details (Optional)
            </label>
            <textarea
              {...register('address_details')}
              rows={2}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Apartment number, gate code, special instructions..."
            />
          </div>

          {/* Date & Priority */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Date (Optional)
              </label>
              <Input
                type="date"
                {...register('scheduled_date')}
                min={getMinDate()}
                leftIcon={<CalendarIcon className="h-5 w-5" />}
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                {...register('priority')}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRequestModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createPickup.isPending}
              disabled={availableEntries.length === 0}
              className="flex-1"
            >
              Request Pickup
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Pickup Card Component
function PickupCard({
  pickup,
  index,
  onCancel,
  isCancelling,
}: {
  pickup: Pickup;
  index: number;
  onCancel?: () => void;
  isCancelling?: boolean;
}) {
  const status = STATUS_CONFIG[pickup.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <TruckIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {pickup.priority && pickup.priority !== 'NORMAL' && (
                    <Badge variant={pickup.priority === 'URGENT' ? 'danger' : pickup.priority === 'HIGH' ? 'warning' : 'secondary'}>
                      {pickup.priority}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  <MapPinIcon className="mr-1 inline h-4 w-4" />
                  {pickup.address}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {pickup.scheduled_date
                  ? formatDate(pickup.scheduled_date)
                  : pickup.created_at
                    ? formatDate(pickup.created_at)
                    : 'Not scheduled'}
              </span>
              {pickup.qr_code && (
                <span className="text-xs font-mono text-gray-400">
                  {pickup.qr_code}
                </span>
              )}
            </div>
          </div>

          {pickup.status === 'REQUESTED' && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              loading={isCancelling}
              className="text-red-600 hover:bg-red-50"
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
