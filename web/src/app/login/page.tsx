'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card } from '@/components/ui';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import AuthHero from '@/components/auth/AuthHero';
import ExploreMessage from '@/components/auth/ExploreMessage';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showExplore, setShowExplore] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ username: email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-900">
      <AnimatedBackground />
      <ExploreMessage isOpen={showExplore} onClose={() => setShowExplore(false)} />

      <div className="w-full max-w-md relative z-10">
        <AuthHero />

        <Card variant="elevated" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => setShowExplore(true)}
              className="w-full py-2.5 text-emerald-400 hover:text-emerald-300 border border-emerald-600/30 hover:border-emerald-600/50 rounded-lg font-medium transition-all duration-200 hover:bg-emerald-600/5"
            >
              Explore Why This Matters
            </button>

            <div className="text-center">
              <p className="text-gray-400">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-6 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
          <p className="text-xs text-gray-400 text-center">
            Open-source civic technology for sustainable communities
          </p>
        </div>
      </div>
    </div>
  );
}
