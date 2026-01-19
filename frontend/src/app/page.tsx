'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Footer from '@/components/ui/Footer';
import FeatureCard from '@/components/ui/FeatureCard';
import StatCard from '@/components/ui/StatCard';
import Section from '@/components/ui/Section';
import SectionHeader from '@/components/ui/SectionHeader';
import { 
  Scan, 
  BarChart3, 
  Leaf,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';

const Scene3D = dynamic(() => import('@/components/three/Scene3D'), { 
  ssr: false,
  loading: () => <div className="three-canvas bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900" />
});

const features = [
  'use client';

  import Link from 'next/link';

  export default function HomePage() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold text-white">SmartWaste</h1>
        <p className="text-gray-400 text-sm text-center max-w-md">
          Minimal scaffold. Use the buttons below to log in or create an account.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth?mode=login" className="px-6 py-3 rounded-lg bg-white/10 text-white text-sm text-center">
            Log In
          </Link>
          <Link href="/auth?mode=signup" className="px-6 py-3 rounded-lg bg-emerald-500 text-white text-sm text-center">
            Sign Up
          </Link>
        </div>
      </div>
    );
  }
  { value: '50K+', label: 'Users' },
