/**
 * Driver Dashboard Page
 * =====================
 * 
 * Main dashboard for waste collection drivers.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

import { api, formatDate } from '@/lib';
import { useAuth } from '@/lib/auth';
import { Card, StatsCard, Button, Badge, Spinner } from '@/components/ui';
import type { Pickup, PickupStatus } from '@/types';

interface DriverStats {
  total_pickups: number;
  completed_today: number;
  pending_pickups: number;
  rating: number;
}

const STATUS_CONFIG: Record<PickupStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' }> = {
  REQUESTED: { label: 'Requested', variant: 'warning' },
  ASSIGNED: { label: 'Assigned', variant: 'default' },
  EN_ROUTE: { label: 'En Route', variant: 'default' },
  ARRIVED: { label: 'Arrived', variant: 'success' },
  COLLECTED: { label: 'Collected', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

export function DriverDashboardPage() {
  // Get real user from auth context
  const { user } = useAuth();

  // Fetch driver stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['DRIVER', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<DriverStats>('/pickups/driver/stats');
      return data;
    },
  });

  // Fetch assigned pickups
  const { data: pickups, isLoading: loadingPickups } = useQuery({
    queryKey: ['DRIVER', 'pickups'],
    queryFn: async () => {
      const { data } = await api.get<Pickup[]>('/pickups/driver/assigned');
      return data;
    },
  });

  const activePickups = pickups?.filter((p) => ['assigned', 'EN_ROUTE'].includes(p.status)) || [];
  const inProgress = pickups?.find((p) => p.status === 'EN_ROUTE');

  if (loadingStats || loadingPickups) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.first_name}! 🚛
          </h1>
          <p className="mt-1 text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Link to="/driver/map">
          <Button size="lg" leftIcon={<MapPinIcon className="h-5 w-5" />}>
            Open Route Map
          </Button>
        </Link>
      </div>

      {/* Current Pickup Banner */}
      {inProgress && (
        <Card className="border-2 border-primary-200 bg-primary-50/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 animate-pulse">
                <TruckIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">In Progress</Badge>
                </div>
                <p className="mt-1 font-medium text-gray-900">{inProgress.address}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4" />
                  <span>Started {formatDate(inProgress.updated_at)}</span>
                </div>
              </div>
            </div>
            <Link to="/driver/pickups">
              <Button>View Details</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Pickups"
          value={stats?.total_pickups || 0}
          icon={<TruckIcon className="h-6 w-6" />}
          iconColor="bg-primary-100 text-primary-600"
        />
        <StatsCard
          title="Completed Today"
          value={stats?.completed_today || 0}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="PENDING"
          value={stats?.pending_pickups || 0}
          icon={<ExclamationCircleIcon className="h-6 w-6" />}
          iconColor="bg-yellow-100 text-yellow-600"
        />
        <StatsCard
          title="Rating"
          value={stats?.rating?.toFixed(1) || '5.0'}
          suffix="★"
          icon={<span className="text-lg">⭐</span>}
          iconColor="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Today's Pickups */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Today's Pickups</h2>
          <Link to="/driver/pickups" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View all
          </Link>
        </div>

        {activePickups.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No pickups assigned for today</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {activePickups.slice(0, 5).map((pickup, index) => (
              <div
                key={pickup.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900">{pickup.address}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {pickup.scheduled_time_start || 'Flexible'}
                    </span>
                    {pickup.priority && (
                      <span>• {pickup.priority}</span>
                    )}
                  </div>
                </div>
                <Badge variant={STATUS_CONFIG[pickup.status].variant}>
                  {STATUS_CONFIG[pickup.status].label}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/driver/pickups">
          <Card className="h-full transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                <TruckIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">My Pickups</p>
                <p className="text-sm text-gray-500">View all assigned pickups</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/driver/map">
          <Card className="h-full transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100">
                <MapPinIcon className="h-6 w-6 text-secondary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Route Map</p>
                <p className="text-sm text-gray-500">Navigate to pickups</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/profile">
          <Card className="h-full transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Settings</p>
                <p className="text-sm text-gray-500">Manage your account</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

