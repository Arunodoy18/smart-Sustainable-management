/**
 * Admin Analytics Page
 * ====================
 * 
 * Platform analytics and reporting.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';

import { api, cn } from '@/lib';
import { Card, Button, Spinner } from '@/components/ui';

type TimeRange = '7d' | '30d' | '90d' | '1y';

interface AnalyticsData {
  waste_by_category: { category: string; count: number; percentage: number }[];
  daily_uploads: { date: string; count: number }[];
  pickup_status: { status: string; count: number }[];
  user_growth: { date: string; users: number; drivers: number }[];
  zone_performance: { zone: string; pickups: number; rating: number }[];
  environmental_impact: {
    total_co2_saved: number;
    total_items_recycled: number;
    water_saved_liters: number;
    trees_equivalent: number;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin', 'analytics', timeRange],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsData>(`/api/v1/admin/analytics/zones?range=${timeRange}`);
      return data;
    },
  });

  // Mock data for demo
  const mockAnalytics: AnalyticsData = {
    waste_by_category: [
      { category: 'Recyclable', count: 4523, percentage: 38 },
      { category: 'Organic', count: 3156, percentage: 26 },
      { category: 'General', count: 2134, percentage: 18 },
      { category: 'Electronic', count: 1245, percentage: 10 },
      { category: 'Hazardous', count: 956, percentage: 8 },
    ],
    daily_uploads: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: Math.floor(Math.random() * 100) + 50,
    })),
    pickup_status: [
      { status: 'Completed', count: 5234 },
      { status: 'Pending', count: 156 },
      { status: 'In Progress', count: 89 },
      { status: 'Cancelled', count: 45 },
    ],
    user_growth: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
      users: Math.floor(Math.random() * 200) + 100 * (i + 1),
      drivers: Math.floor(Math.random() * 10) + 5 * (i + 1),
    })),
    zone_performance: [
      { zone: 'Zone A', pickups: 1234, rating: 4.8 },
      { zone: 'Zone B', pickups: 987, rating: 4.6 },
      { zone: 'Zone C', pickups: 756, rating: 4.9 },
      { zone: 'Zone D', pickups: 543, rating: 4.5 },
    ],
    environmental_impact: {
      total_co2_saved: 4523.5,
      total_items_recycled: 15678,
      water_saved_liters: 125000,
      trees_equivalent: 89,
    },
  };

  const displayAnalytics = analytics || mockAnalytics;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="mt-1 text-gray-600">
            Platform performance and environmental impact
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline" leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700">CO2 Saved</p>
          <p className="mt-1 text-2xl font-bold text-green-900">
            {displayAnalytics.environmental_impact.total_co2_saved.toLocaleString()} kg
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700">Items Recycled</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {displayAnalytics.environmental_impact.total_items_recycled.toLocaleString()}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <p className="text-sm text-cyan-700">Water Saved</p>
          <p className="mt-1 text-2xl font-bold text-cyan-900">
            {(displayAnalytics.environmental_impact.water_saved_liters / 1000).toFixed(1)}k L
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <p className="text-sm text-emerald-700">Trees Equivalent</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {displayAnalytics.environmental_impact.trees_equivalent} 🌳
          </p>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Waste by Category */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Waste by Category</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayAnalytics.waste_by_category}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="category"
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                >
                  {displayAnalytics.waste_by_category.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pickup Status */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Pickup Status Distribution</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayAnalytics.pickup_status} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="status" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Daily Uploads Trend */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900">Daily Waste Classifications</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayAnalytics.daily_uploads}>
              <defs>
                <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorUploads)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* User Growth */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">User & Driver Growth</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayAnalytics.user_growth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDrivers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  strokeWidth={2}
                  name="Citizens"
                />
                <Area
                  type="monotone"
                  dataKey="drivers"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorDrivers)"
                  strokeWidth={2}
                  name="Drivers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Zone Performance */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Zone Performance</h2>
          <div className="mt-4 space-y-4">
            {displayAnalytics.zone_performance.map((zone, index) => (
              <div key={zone.zone} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{zone.zone}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{zone.pickups} pickups</span>
                    <span className="font-medium text-yellow-600">{zone.rating} ⭐</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(zone.pickups / Math.max(...displayAnalytics.zone_performance.map(z => z.pickups))) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Report Actions */}
      <Card className="bg-gray-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Generate Reports</h3>
            <p className="text-sm text-gray-600">
              Download detailed analytics reports
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              Weekly Report
            </Button>
            <Button variant="outline" size="sm">
              Monthly Report
            </Button>
            <Button size="sm">
              Custom Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
