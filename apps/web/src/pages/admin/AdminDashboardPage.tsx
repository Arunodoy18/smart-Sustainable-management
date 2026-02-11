/**
 * Admin Dashboard Page
 * ====================
 * 
 * System overview and key metrics for administrators.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  TruckIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import { api, formatDate } from '@/lib';
import { Card, StatsCard, Badge, Spinner, Progress } from '@/components/ui';

interface AdminStats {
  total_users: number;
  active_users: number;
  total_drivers: number;
  active_drivers: number;
  total_pickups: number;
  completed_pickups: number;
  pending_pickups: number;
  total_waste_entries: number;
  co2_saved_kg: number;
  growth_rate: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'pickup_completed' | 'classification' | 'driver_assigned';
  description: string;
  timestamp: string;
}

interface SystemHealth {
  api_status: 'healthy' | 'degraded' | 'down';
  database_status: 'healthy' | 'degraded' | 'down';
  ml_service_status: 'healthy' | 'degraded' | 'down';
  storage_usage_percent: number;
}

export function AdminDashboardPage() {
  // Fetch admin stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminStats>('/api/v1/admin/dashboard');
      return data;
    },
  });

  // Fetch recent activity
  const { data: activity } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: async () => {
      const { data } = await api.get<RecentActivity[]>('/api/v1/admin/dashboard');
      return data;
    },
  });

  // Fetch system health
  const { data: health } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: async () => {
      const { data } = await api.get<SystemHealth>('/api/v1/admin/health');
      return data;
    },
  });

  // Mock data for demo — removed: use only real API data
  const emptyStats: AdminStats = {
    total_users: 0,
    active_users: 0,
    total_drivers: 0,
    active_drivers: 0,
    total_pickups: 0,
    completed_pickups: 0,
    pending_pickups: 0,
    total_waste_entries: 0,
    co2_saved_kg: 0,
    growth_rate: 0,
  };

  const emptyHealth: SystemHealth = {
    api_status: 'healthy',
    database_status: 'healthy',
    ml_service_status: 'healthy',
    storage_usage_percent: 0,
  };

  const displayStats = stats || emptyStats;
  const displayActivity = activity || [];
  const displayHealth = health || emptyHealth;

  if (loadingStats) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">
          System overview and key performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={displayStats.total_users}
          icon={<UsersIcon className="h-6 w-6" />}
          iconColor="bg-blue-100 text-blue-600"
          change={displayStats.growth_rate}
          changeLabel="vs last month"
        />
        <StatsCard
          title="Active Drivers"
          value={displayStats.active_drivers}
          suffix={`/ ${displayStats.total_drivers}`}
          icon={<TruckIcon className="h-6 w-6" />}
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Total Pickups"
          value={displayStats.total_pickups}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          iconColor="bg-primary-100 text-primary-600"
        />
        <StatsCard
          title="CO2 Saved"
          value={displayStats.co2_saved_kg.toFixed(0)}
          suffix="kg"
          icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
          iconColor="bg-green-100 text-green-600"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* System Health */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          <div className="mt-4 space-y-4">
            <HealthItem label="API Service" status={displayHealth.api_status} />
            <HealthItem label="Database" status={displayHealth.database_status} />
            <HealthItem label="ML Service" status={displayHealth.ml_service_status} />
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Storage Usage</span>
                <span className="font-medium">{displayHealth.storage_usage_percent}%</span>
              </div>
              <Progress
                value={displayHealth.storage_usage_percent}
                className="mt-2"
                color={displayHealth.storage_usage_percent > 80 ? 'danger' : 'primary'}
              />
            </div>
          </div>
        </Card>

        {/* Pickup Stats */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Pickup Status</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">
                {displayStats.completed_pickups}
              </span>
            </div>
            <Progress
              value={displayStats.total_pickups > 0 ? (displayStats.completed_pickups / displayStats.total_pickups) * 100 : 0}
              color="success"
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">
                {displayStats.pending_pickups}
              </span>
            </div>
            <Progress
              value={displayStats.total_pickups > 0 ? (displayStats.pending_pickups / displayStats.total_pickups) * 100 : 0}
              color="warning"
            />

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                Completion Rate:{' '}
                <span className="font-semibold text-gray-900">
                  {displayStats.total_pickups > 0 ? ((displayStats.completed_pickups / displayStats.total_pickups) * 100).toFixed(1) : '0.0'}%
                </span>
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
            >
              <UsersIcon className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-700">Manage Users</span>
            </Link>
            <Link
              to="/admin/drivers"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
            >
              <TruckIcon className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-700">Manage Drivers</span>
            </Link>
            <Link
              to="/admin/analytics"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
            >
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-700">View Analytics</span>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link to="/admin/activity" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {displayActivity.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getActivityColor(item.type)}`}>
                {getActivityIcon(item.type)}
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{item.description}</p>
                <p className="text-sm text-gray-500">{formatDate(item.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Health status item component
function HealthItem({ label, status }: { label: string; status: 'healthy' | 'degraded' | 'down' }) {
  const config = {
    healthy: { color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircleIcon className="h-4 w-4" /> },
    degraded: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
    down: { color: 'text-red-600', bg: 'bg-red-100', icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className={`flex items-center gap-1.5 rounded-full px-2 py-1 ${config[status].bg}`}>
        <span className={config[status].color}>{config[status].icon}</span>
        <span className={`text-xs font-medium capitalize ${config[status].color}`}>{status}</span>
      </div>
    </div>
  );
}

// Activity helpers
function getActivityColor(type: RecentActivity['type']) {
  const colors = {
    user_registered: 'bg-blue-100',
    pickup_completed: 'bg-green-100',
    classification: 'bg-primary-100',
    driver_assigned: 'bg-purple-100',
  };
  return colors[type];
}

function getActivityIcon(type: RecentActivity['type']) {
  const icons = {
    user_registered: <UsersIcon className="h-5 w-5 text-blue-600" />,
    pickup_completed: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
    classification: <ChartBarIcon className="h-5 w-5 text-primary-600" />,
    driver_assigned: <TruckIcon className="h-5 w-5 text-purple-600" />,
  };
  return icons[type];
}
