'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  BarChart3,
  Download
} from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white">
              <span className="gradient-text">Analytics</span> Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Track your environmental impact and recycling habits
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                    timeRange === range
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </motion.div>
        </div>

        {/* Empty state since live data isn't wired yet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8 flex flex-col items-center text-center gap-4"
        >
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Analytics will appear once data is available</h2>
          <p className="text-sm text-gray-400 max-w-xl">
            Start classifying waste to generate insights. We&apos;ll surface trends, top items, and impact metrics as soon as real events arrive from the API.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/classify')}
              className="btn-primary"
            >
              Classify Now
            </button>
            <button className="btn-secondary" disabled>
              Export
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
