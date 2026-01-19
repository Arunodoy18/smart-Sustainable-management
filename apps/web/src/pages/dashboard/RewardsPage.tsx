/**
 * Rewards Page
 * ============
 * 
 * Points, streaks, achievements, and leaderboard.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  FireIcon,
  StarIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

import { api, cn } from '@/lib';
import { Card, Badge, Avatar, Progress, Spinner, CircularProgress } from '@/components/ui';
import type { RewardSummary, Achievement, LeaderboardEntry } from '@/types';

export function RewardsPage() {
  const [selectedTab, setSelectedTab] = useState(0);

  // Fetch reward summary
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['rewards', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<RewardSummary>('/rewards/summary');
      return data;
    },
  });

  // Fetch achievements
  const { data: achievements } = useQuery({
    queryKey: ['rewards', 'achievements'],
    queryFn: async () => {
      const { data } = await api.get<Achievement[]>('/rewards/achievements');
      return data;
    },
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['rewards', 'leaderboard'],
    queryFn: async () => {
      const { data } = await api.get<LeaderboardEntry[]>('/rewards/leaderboard');
      return data;
    },
  });

  // Fetch streak info
  const { data: streak } = useQuery({
    queryKey: ['rewards', 'streak'],
    queryFn: async () => {
      const { data } = await api.get('/rewards/streak');
      return data as { current_streak: number; longest_streak: number; last_activity: string };
    },
  });

  const levelNames = ['', 'Eco Starter', 'Green Guardian', 'Sustainability Hero', 'Eco Champion', 'Planet Protector'];

  if (loadingSummary) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rewards & Achievements</h1>
        <p className="mt-1 text-gray-600">
          Track your progress and compete with others
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <TrophyIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{summary?.total_points || 0}</p>
          <p className="text-sm text-gray-500">Total Points</p>
        </Card>

        <Card className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <FireIcon className="h-6 w-6 text-orange-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{streak?.current_streak || 0}</p>
          <p className="text-sm text-gray-500">Day Streak</p>
        </Card>

        <Card className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <StarIcon className="h-6 w-6 text-primary-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            Level {summary?.level || 1}
          </p>
          <p className="text-sm text-gray-500">{levelNames[summary?.level || 1]}</p>
        </Card>

        <Card className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {achievements?.filter((a) => a.earned_at).length || 0}
          </p>
          <p className="text-sm text-gray-500">Achievements</p>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="mb-8">
        <div className="flex items-center gap-6">
          <CircularProgress
            value={summary?.level_progress || 0}
            size={80}
            strokeWidth={8}
            color="primary"
          >
            <span className="text-xl font-bold text-primary-600">
              {summary?.level || 1}
            </span>
          </CircularProgress>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {levelNames[summary?.level || 1]}
            </h3>
            <p className="text-sm text-gray-600">
              {summary?.points_to_next_level || 0} points to reach{' '}
              {levelNames[(summary?.level || 1) + 1] || 'Max Level'}
            </p>
            <Progress
              value={summary?.level_progress || 0}
              className="mt-2"
              color="primary"
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
          {['Achievements', 'Leaderboard', 'Streak'].map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                cn(
                  'flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors',
                  selected
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {/* Achievements */}
          <Tab.Panel>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {achievements?.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      'relative overflow-hidden transition-all',
                      achievement.earned_at
                        ? 'border-primary-200 bg-primary-50/50'
                        : 'opacity-60 grayscale'
                    )}
                  >
                    {achievement.earned_at && (
                      <div className="absolute right-2 top-2">
                        <Badge variant="success" size="sm">
                          Earned
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
                          achievement.earned_at ? 'bg-primary-100' : 'bg-gray-100'
                        )}
                      >
                        {achievement.icon || '🏆'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {achievement.description}
                        </p>
                        <p className="mt-2 text-sm font-medium text-primary-600">
                          +{achievement.points_reward} points
                        </p>
                      </div>
                    </div>
                    {!achievement.earned_at && achievement.progress !== undefined && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>
                            {achievement.progress}/{achievement.target}
                          </span>
                        </div>
                        <Progress
                          value={(achievement.progress / (achievement.target || 1)) * 100}
                          className="mt-1"
                          color="gray"
                        />
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </Tab.Panel>

          {/* Leaderboard */}
          <Tab.Panel>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">This Month's Top Recyclers</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {leaderboard?.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-center gap-4 py-3',
                      entry.is_current_user && 'rounded-lg bg-primary-50 -mx-4 px-4'
                    )}
                  >
                    {/* Rank */}
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-500'
                      )}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : entry.rank}
                    </div>

                    {/* User */}
                    <Avatar
                      src={entry.avatar_url}
                      name={entry.display_name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {entry.display_name}
                        {entry.is_current_user && (
                          <span className="ml-2 text-primary-600">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">Level {entry.level}</p>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{entry.points}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </Tab.Panel>

          {/* Streak */}
          <Tab.Panel>
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                  <FireIcon className="h-10 w-10 text-orange-600" />
                </div>
                <p className="mt-4 text-4xl font-bold text-gray-900">
                  {streak?.current_streak || 0}
                </p>
                <p className="text-gray-600">Current Streak</p>
                <p className="mt-2 text-sm text-gray-500">
                  Keep uploading daily to maintain your streak!
                </p>
              </Card>

              <Card className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
                  <TrophyIcon className="h-10 w-10 text-primary-600" />
                </div>
                <p className="mt-4 text-4xl font-bold text-gray-900">
                  {streak?.longest_streak || 0}
                </p>
                <p className="text-gray-600">Longest Streak</p>
                <p className="mt-2 text-sm text-gray-500">
                  Your personal best!
                </p>
              </Card>
            </div>

            <Card className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Streak Rewards</h3>
              <div className="space-y-3">
                {[
                  { days: 3, bonus: 10, label: '3 Day Streak' },
                  { days: 7, bonus: 25, label: 'Week Warrior' },
                  { days: 14, bonus: 50, label: 'Two Week Champion' },
                  { days: 30, bonus: 100, label: 'Monthly Master' },
                ].map((milestone) => (
                  <div
                    key={milestone.days}
                    className={cn(
                      'flex items-center justify-between rounded-lg p-3',
                      (streak?.current_streak || 0) >= milestone.days
                        ? 'bg-primary-50 border border-primary-200'
                        : 'bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {(streak?.current_streak || 0) >= milestone.days ? '✅' : '🔒'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{milestone.label}</p>
                        <p className="text-sm text-gray-500">
                          {milestone.days} consecutive days
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        (streak?.current_streak || 0) >= milestone.days
                          ? 'success'
                          : 'secondary'
                      }
                    >
                      +{milestone.bonus} bonus
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
