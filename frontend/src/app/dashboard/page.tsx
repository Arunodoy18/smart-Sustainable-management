'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Scan, 
  BarChart3, 
  History, 
  ArrowRight,
  Loader2
} from 'lucide-react';

const quickActions = [
  {
    title: 'View Analytics',
    description: 'Track your statistics',
    href: '/analytics',
    icon: BarChart3,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'View History',
    description: 'Past classifications',
    href: '/history',
    icon: History,
    gradient: 'from-purple-500 to-pink-500',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.full_name || 'User'}
          </h1>
          <p className="text-sm text-gray-400">
            Here&apos;s your impact overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          {[1, 2, 3].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-3"
            >
              <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10" />
              <div className="h-6 w-24 bg-white/5 rounded" />
              <div className="h-4 w-32 bg-white/5 rounded" />
              <p className="text-xs text-gray-500">Live stats will appear after you start scanning.</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Primary Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Link href="/classify">
            <div className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 md:p-10 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Scan Waste
                  </h2>
                  <p className="text-emerald-100 text-lg">
                    Classify items with AI-powered recognition
                  </p>
                </div>
                <div className="hidden md:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center group-hover:scale-110 transition-transform">
                  <Scan className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Secondary Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-8"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group h-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {action.description}
                  </p>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
