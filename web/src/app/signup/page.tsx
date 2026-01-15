'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { UserRole } from '@/lib/types';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import AuthHero from '@/components/auth/AuthHero';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'user' as UserRole,
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: formData.role,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  const roles: { value: UserRole; label: string; description: string; icon: string }[] = [
    { value: 'user', label: 'User', description: 'Submit waste for collection', icon: '🏠' },
    { value: 'driver', label: 'Driver', description: 'Collect and verify waste', icon: '🚛' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-900">
      {/* Animated Background */}
      <AnimatedBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Hero Section */}
        <AuthHero />

        <Card variant="elevated" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              autoComplete="name"
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleChange(role.value)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all duration-200',
                      formData.role === role.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-neutral-700 hover:border-neutral-600'
                    )}
                  >
                    <span className="text-2xl">{role.icon}</span>
                    <p className="font-medium text-white mt-2">{role.label}</p>
                    <p className="text-xs text-gray-400">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

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
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        {/* Info hint */}
        <div className="mt-6 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
          <p className="text-xs text-gray-400 text-center">
            Join thousands making waste management smarter
          </p>
        </div>
      </div>
    </div>
  );
}
