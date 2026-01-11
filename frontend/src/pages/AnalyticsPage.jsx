import React, { useState, useEffect } from 'react';
import { wasteAPI } from '../api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await wasteAPI.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Gathering real-time data...</div>;

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  const categoryData = Object.entries(analytics?.category_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const stats = [
    { label: 'Total Scans', value: analytics?.total_entries || 0, color: 'text-blue-500' },
    { label: 'Recycling Rate', value: `${analytics?.recycling_rate || 0}%`, color: 'text-green-500' },
    { label: 'Collection Eff.', value: `${analytics?.collection_efficiency || 0}%`, color: 'text-amber-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold">City Impact Dashboard</h1>
        <p className="text-gray-400">Real-time sustainability metrics and SDG alignment.</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl"
          >
            <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mb-1">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Chart */}
        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl">
          <h3 className="text-xl font-bold mb-6">Waste Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SDG Impact */}
        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl flex flex-col justify-center">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-green-500">🎯</span> SDG Alignment
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-900/30 rounded-xl text-2xl">🏙️</div>
              <div>
                <h4 className="font-bold text-white">SDG 11: Sustainable Cities</h4>
                <p className="text-sm text-gray-400">Optimizing urban waste collection patterns through AI coordination.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-900/30 rounded-xl text-2xl">♻️</div>
              <div>
                <h4 className="font-bold text-white">SDG 12: Responsible Consumption</h4>
                <p className="text-sm text-gray-400">Educating citizens on proper segregation and recycling techniques.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-900/30 rounded-xl text-2xl">🌍</div>
              <div>
                <h4 className="font-bold text-white">SDG 13: Climate Action</h4>
                <p className="text-sm text-gray-400">{analytics?.impact_summary}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
