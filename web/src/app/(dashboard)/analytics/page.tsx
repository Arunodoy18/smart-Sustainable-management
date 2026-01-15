'use client';

import { useEffect, useState } from 'react';
import { wasteApi } from '@/lib/api';
import { Analytics, WasteType } from '@/lib/types';
import { getWasteTypeInfo, getSDGIndicators } from '@/lib/utils';
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton
} from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { 
  Recycle, 
  Leaf, 
  Zap, 
  TreeDeciduous,
  Globe,
  Award
} from 'lucide-react';

const WASTE_COLORS: Record<WasteType, string> = {
  recyclable: '#22c55e',
  organic: '#84cc16',
  e_waste: '#3b82f6',
  hazardous: '#ef4444',
  general: '#6b7280',
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await wasteApi.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="py-12">
          <div className="text-center">
            <p className="text-gray-400">Failed to load analytics</p>
          </div>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const pieData = Object.entries(analytics.by_type).map(([type, count]) => ({
    name: getWasteTypeInfo(type as WasteType).label,
    value: count,
    color: WASTE_COLORS[type as WasteType],
  }));

  const barData = Object.entries(analytics.by_type).map(([type, count]) => ({
    name: getWasteTypeInfo(type as WasteType).label,
    count,
    fill: WASTE_COLORS[type as WasteType],
  }));

  const sdgIndicators = getSDGIndicators({
    recycling_rate: analytics.recycling_rate,
    co2_saved_kg: analytics.co2_saved_kg,
    energy_saved_kwh: analytics.energy_saved_kwh,
  });

  // Environmental impact calculations
  const treesEquivalent = (analytics.co2_saved_kg / 21).toFixed(1); // ~21kg CO2 absorbed per tree/year
  const plasticBottles = Math.round(analytics.co2_saved_kg * 2.5); // Rough estimate
  const carMiles = Math.round(analytics.co2_saved_kg * 2.5); // ~0.4kg CO2 per mile

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Environmental Impact</h1>
        <p className="text-gray-400 mt-1">
          Your contribution to sustainability
        </p>
      </div>

      {/* Key Metrics */}
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
              <p className="text-sm text-gray-400">CO₂ Prevented</p>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Waste Category Distribution</CardTitle>
            <CardDescription>Breakdown by waste type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e2730',
                      border: '1px solid #2a3542',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-gray-300 text-sm">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Waste Count Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Category</CardTitle>
            <CardDescription>Number of items processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#6b7280" 
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e2730',
                      border: '1px solid #2a3542',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Equivalents */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Equivalents</CardTitle>
          <CardDescription>
            Your impact in relatable terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background-secondary">
              <div className="w-14 h-14 rounded-xl bg-accent-green/20 flex items-center justify-center">
                <TreeDeciduous className="w-7 h-7 text-accent-green" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{treesEquivalent}</p>
                <p className="text-sm text-gray-400">Trees planted equivalent</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-background-secondary">
              <div className="w-14 h-14 rounded-xl bg-status-accepted/20 flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{carMiles}</p>
                <p className="text-sm text-gray-400">Car miles offset</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-background-secondary">
              <div className="w-14 h-14 rounded-xl bg-eco-500/20 flex items-center justify-center">
                <span className="text-2xl">♻️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{plasticBottles}</p>
                <p className="text-sm text-gray-400">Plastic bottles recycled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDG Alignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-eco-400" />
            UN Sustainable Development Goals
          </CardTitle>
          <CardDescription>
            Alignment with global sustainability objectives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sdgIndicators.map((sdg) => (
              <div
                key={sdg.number}
                className="p-4 rounded-xl border border-surface-hover hover:border-eco-500/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white',
                    sdg.number === 11 && 'bg-orange-500',
                    sdg.number === 12 && 'bg-amber-600',
                    sdg.number === 13 && 'bg-green-600'
                  )}>
                    {sdg.number}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{sdg.title}</h4>
                    <p className="text-xs text-gray-400">{sdg.description}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Contribution</span>
                    <span className="text-eco-400">{Math.round(sdg.value)}%</span>
                  </div>
                  <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        sdg.number === 11 && 'bg-orange-500',
                        sdg.number === 12 && 'bg-amber-600',
                        sdg.number === 13 && 'bg-green-600'
                      )}
                      style={{ width: `${Math.min(100, sdg.value)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{sdg.contribution}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-3xl font-bold text-white">{analytics.total_entries}</p>
            <p className="text-sm text-gray-400 mt-1">Total Submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-4">
            <p className="text-3xl font-bold text-white">{analytics.pending_pickups}</p>
            <p className="text-sm text-gray-400 mt-1">Pending Pickups</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-4">
            <p className="text-3xl font-bold text-white">{analytics.collected_today}</p>
            <p className="text-sm text-gray-400 mt-1">Collected Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-4">
            <p className="text-3xl font-bold text-white">{(analytics.avg_confidence * 100).toFixed(0)}%</p>
            <p className="text-sm text-gray-400 mt-1">Avg Confidence</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
