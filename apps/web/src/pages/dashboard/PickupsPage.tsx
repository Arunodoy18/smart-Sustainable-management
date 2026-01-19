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
import type { Pickup, PickupStatus, WasteCategory } from '@/types';

const pickupSchema = z.object({
  address: z.string().min(10, 'Please enter a complete address'),
  notes: z.string().optional(),
  preferred_date: z.string().min(1, 'Please select a date'),
  preferred_time_slot: z.enum(['morning', 'afternoon', 'evening']),
  waste_types: z.array(z.string()).min(1, 'Select at least one waste type'),
});

type PickupFormData = z.infer<typeof pickupSchema>;

const STATUS_CONFIG: Record<PickupStatus, { label: string; color: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', variant: 'warning' },
  assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700', variant: 'default' },
  in_progress: { label: 'In Progress', color: 'bg-primary-100 text-primary-700', variant: 'default' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', variant: 'success' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', variant: 'secondary' },
};

const WASTE_TYPES = [
  { value: 'recyclable', label: 'Recyclables', icon: '♻️' },
  { value: 'organic', label: 'Organic Waste', icon: '🌿' },
  { value: 'electronic', label: 'E-Waste', icon: '📱' },
  { value: 'hazardous', label: 'Hazardous', icon: '⚠️' },
  { value: 'general', label: 'General Waste', icon: '🗑️' },
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (8AM - 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
  { value: 'evening', label: 'Evening (5PM - 8PM)' },
];

export function PickupsPage() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const queryClient = useQueryClient();

  // Fetch pickups
  const { data: pickups, isLoading } = useQuery({
    queryKey: ['pickups'],
    queryFn: async () => {
      const { data } = await api.get<Pickup[]>('/pickups');
      return data;
    },
  });

  // Create pickup mutation
  const createPickup = useMutation({
    mutationFn: async (data: PickupFormData) => {
      const { data: result } = await api.post('/pickups', {
        address: data.address,
        notes: data.notes,
        preferred_date: data.preferred_date,
        preferred_time_slot: data.preferred_time_slot,
        waste_types: data.waste_types,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      setShowRequestModal(false);
    },
  });

  // Cancel pickup mutation
  const cancelPickup = useMutation({
    mutationFn: async (pickupId: string) => {
      await api.post(`/pickups/${pickupId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PickupFormData>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      preferred_time_slot: 'morning',
      waste_types: [],
    },
  });

  const selectedWasteTypes = watch('waste_types') || [];

  const toggleWasteType = (type: string) => {
    const current = selectedWasteTypes;
    if (current.includes(type)) {
      setValue('waste_types', current.filter((t) => t !== type));
    } else {
      setValue('waste_types', [...current, type]);
    }
  };

  const onSubmit = (data: PickupFormData) => {
    createPickup.mutate(data);
  };

  const activePickups = pickups?.filter((p) => ['pending', 'assigned', 'in_progress'].includes(p.status)) || [];
  const completedPickups = pickups?.filter((p) => p.status === 'completed') || [];
  const cancelledPickups = pickups?.filter((p) => p.status === 'cancelled') || [];

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

          {/* Waste Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waste Types
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WASTE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleWasteType(type.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-3 text-left transition-colors',
                    selectedWasteTypes.includes(type.value)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span>{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
            {errors.waste_types && (
              <p className="mt-1 text-sm text-red-600">{errors.waste_types.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Date
              </label>
              <Input
                type="date"
                {...register('preferred_date')}
                min={getMinDate()}
                error={errors.preferred_date?.message}
                leftIcon={<CalendarIcon className="h-5 w-5" />}
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time Slot
              </label>
              <select
                {...register('preferred_time_slot')}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Any special instructions for the driver..."
            />
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
                  {pickup.driver && (
                    <span className="text-sm text-gray-500">
                      Driver: {pickup.driver.first_name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  <MapPinIcon className="mr-1 inline h-4 w-4" />
                  {pickup.address}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {pickup.waste_types?.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-700"
                >
                  {type.replace('_', ' ')}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {pickup.scheduled_date
                  ? formatDate(pickup.scheduled_date)
                  : formatDate(pickup.preferred_date)}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {pickup.preferred_time_slot.replace('_', ' ')}
              </span>
            </div>
          </div>

          {pickup.status === 'pending' && onCancel && (
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
