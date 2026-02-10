/**
 * Dashboard Page
 * ==============
 * 
 * Main user dashboard with stats and quick actions.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CloudArrowUpIcon,
  TrophyIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

import { api } from '@/lib';
import { useAuth } from '@/lib/auth';
import { Card, StatsCard, Button, Badge, Progress, LoadingInline } from '@/components/ui';
import type { RewardSummary, ImpactStats, WasteEntry } from '@/types';

export function DashboardPage() {
  // Get real user from auth context
  const { user } = useAuth();

  // Fetch reward summary
  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ['rewards', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<RewardSummary>('/api/v1/rewards/summary');
      return data;
    },
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  // Fetch impact stats
  const { data: impact } = useQuery({
    queryKey: ['waste', 'impact'],
    queryFn: async () => {
      const { data } = await api.get<ImpactStats>('/api/v1/waste/stats/impact');
      return data;
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Fetch recent entries
  const { data: recentEntries } = useQuery({
    queryKey: ['waste', 'history', 'recent'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/waste/history', { params: { page_size: 5 } });
      return data.items as WasteEntry[];
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const levelNames = ['', 'Eco Starter', 'Green Guardian', 'Sustainability Hero', 'Eco Champion', 'Planet Protector'];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="mt-1 text-gray-600">
            Ready to make a difference today?
          </p>
        </div>
        <Link to="/dashboard/upload">
          <Button size="lg" leftIcon={<CloudArrowUpIcon className="h-5 w-5" />}>
            Upload Waste
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Points"
          value={rewards?.total_points || 0}
          icon={<TrophyIcon className="h-6 w-6" />}
          iconColor="bg-yellow-100 text-yellow-600"
        />
        <StatsCard
          title="Current Streak"
          value={rewards?.current_streak || 0}
          suffix="days"
          icon={<FireIcon className="h-6 w-6" />}
          iconColor="bg-orange-100 text-orange-600"
        />
        <StatsCard
          title="Level"
          value={levelNames[rewards?.level || 1]}
          icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
          iconColor="bg-primary-100 text-primary-600"
        />
        <StatsCard
          title="CO2 Saved"
          value={impact?.co2_saved_kg || 0}
          suffix="kg"
          icon={<GlobeAltIcon className="h-6 w-6" />}
          iconColor="bg-green-100 text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Level Progress */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Level Progress</h2>
          {loadingRewards ? (
            <LoadingInline />
          ) : (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Level {rewards?.level || 1}: {levelNames[rewards?.level || 1]}
                </span>
                <span className="text-gray-500">
                  {rewards?.level_progress?.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={rewards?.level_progress || 0}
                className="mt-2"
                color="primary"
              />
              <p className="mt-2 text-sm text-gray-500">
                {rewards?.points_to_next_level || 0} points to next level
              </p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <Link
              to="/dashboard/upload"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <CloudArrowUpIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Upload Waste Photo</p>
                <p className="text-sm text-gray-500">Get AI classification</p>
              </div>
            </Link>
            <Link
              to="/dashboard/pickups"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100">
                <svg className="h-5 w-5 text-secondary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Request Pickup</p>
                <p className="text-sm text-gray-500">Schedule a collection</p>
              </div>
            </Link>
            <Link
              to="/dashboard/rewards"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <TrophyIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Rewards</p>
                <p className="text-sm text-gray-500">Check achievements</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Environmental Impact */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Your Impact</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Items Recycled</span>
              <span className="font-semibold text-gray-900">{impact?.total_entries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CO2 Saved</span>
              <span className="font-semibold text-gray-900">{impact?.co2_saved_kg || 0} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Trees Equivalent</span>
              <span className="font-semibold text-gray-900">{impact?.trees_equivalent || 0} 🌳</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Water Saved</span>
              <span className="font-semibold text-gray-900">{impact?.water_saved_liters || 0} L</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link to="/dashboard/history" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View all
          </Link>
        </div>
        <div className="mt-4">
          {!recentEntries || recentEntries.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No waste entries yet. Start by uploading a photo!
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 py-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {entry.image_url && (
                      <img
                        src={entry.image_url}
                        alt="Waste"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {entry.category?.replace('_', ' ') || 'PENDING'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {entry.ai_confidence != null && (
                    <Badge
                      variant={
                        entry.confidence_tier === 'HIGH'
                          ? 'success'
                          : entry.confidence_tier === 'MEDIUM'
                          ? 'warning'
                          : 'danger'
                      }
                      dot
                    >
                      {Math.round(entry.ai_confidence * 100)}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

