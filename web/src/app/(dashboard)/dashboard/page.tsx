'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRealtime } from '@/hooks';
import { wasteApi } from '@/lib/api';
import { WasteEntry, Analytics } from '@/lib/types';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  StatusCard,
  LoadingSpinner,
  Skeleton
} from '@/components/ui';
import { Camera, TrendingUp, Recycle, Leaf, Zap, Award } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentEntries, setRecentEntries] = useState<WasteEntry[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time updates
  const { isConnected } = useRealtime({
    onStatusUpdate: (data) => {
      // Update entry status in real-time
      setRecentEntries((prev) =>
        prev.map((entry) =>
          entry.id === (data as { entry_id: string }).entry_id
            ? { ...entry, status: (data as { status: WasteEntry['status'] }).status }
            : entry
        )
      );
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [entriesData, analyticsData] = await Promise.all([
          wasteApi.getHistory(5),
          wasteApi.getAnalytics(),
        ]);
        setRecentEntries(entriesData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Redirect drivers to their dashboard
  if (user?.role === 'driver') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-eco-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚛</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Driver Dashboard</h1>
          <p className="text-gray-400 mb-6">Access your pickup assignments</p>
          <Link href="/driver">
            <Button size="lg">Go to Pickups</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-gray-400 mt-1">
            {isConnected ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-green pulse-live" />
                Connected in real-time
              </span>
            ) : (
              'Connecting...'
            )}
          </p>
        </div>

        <Link href="/capture">
          <Button size="lg" className="w-full sm:w-auto">
            <Camera className="w-5 h-5 mr-2" />
            Capture Waste
          </Button>
        </Link>
      </div>

      {/* Impact Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="eco-gradient">
            <CardContent className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-eco-500/20 flex items-center justify-center">
                <Recycle className="w-6 h-6 text-eco-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Recycling Rate</p>
                <p className="text-2xl font-bold text-white">{analytics.recycling_rate}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="eco-gradient">
            <CardContent className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-accent-green/20 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-accent-green" />
              </div>
              <div>
                <p className="text-sm text-gray-400">CO₂ Saved</p>
                <p className="text-2xl font-bold text-white">{analytics.co2_saved_kg.toFixed(1)} kg</p>
              </div>
            </CardContent>
          </Card>

          <Card className="eco-gradient">
            <CardContent className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-status-pending/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-status-pending" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Energy Saved</p>
                <p className="text-2xl font-bold text-white">{analytics.energy_saved_kwh.toFixed(0)} kWh</p>
              </div>
            </CardContent>
          </Card>

          <Card className="eco-gradient">
            <CardContent className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-accent-teal/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-accent-teal" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Impact Points</p>
                <p className="text-2xl font-bold text-white">{analytics.points_earned}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/capture" className="block">
          <Card hoverable className="h-full">
            <CardContent className="flex flex-col items-center text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-eco-500/20 flex items-center justify-center mb-4">
                <Camera className="w-7 h-7 text-eco-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Capture & Classify</h3>
              <p className="text-sm text-gray-400">
                Take a photo of waste for AI classification
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/history" className="block">
          <Card hoverable className="h-full">
            <CardContent className="flex flex-col items-center text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-status-accepted/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-status-accepted" />
              </div>
              <h3 className="font-semibold text-white mb-1">View History</h3>
              <p className="text-sm text-gray-400">
                Track your waste submissions and status
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/analytics" className="block">
          <Card hoverable className="h-full">
            <CardContent className="flex flex-col items-center text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-accent-lime/20 flex items-center justify-center mb-4">
                <Leaf className="w-7 h-7 text-accent-lime" />
              </div>
              <h3 className="font-semibold text-white mb-1">Environmental Impact</h3>
              <p className="text-sm text-gray-400">
                See your contribution to sustainability
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/history" className="text-sm text-eco-400 hover:text-eco-300">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No waste entries yet</p>
              <Link href="/capture">
                <Button variant="secondary">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Your First
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <StatusCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
