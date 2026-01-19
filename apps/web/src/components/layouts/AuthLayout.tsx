/**
 * Auth Layout
 * ===========
 * 
 * Layout for authentication pages (login, register, etc.)
 */

import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib';

export function AuthLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    const roleRedirects = {
      citizen: '/dashboard',
      driver: '/driver',
      admin: '/admin',
    };
    return <Navigate to={roleRedirects[user!.role]} replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-12 xl:px-24">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">Smart Waste AI</span>
        </Link>

        {/* Form content */}
        <Outlet />
      </div>

      {/* Right side - Image/Pattern */}
      <div className="hidden lg:block lg:w-1/2">
        <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600 p-12">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <svg
              className="absolute -right-1/4 -top-1/4 h-96 w-96 text-white/10"
              fill="currentColor"
              viewBox="0 0 200 200"
            >
              <circle cx="100" cy="100" r="100" />
            </svg>
            <svg
              className="absolute -bottom-1/4 -left-1/4 h-96 w-96 text-white/10"
              fill="currentColor"
              viewBox="0 0 200 200"
            >
              <circle cx="100" cy="100" r="100" />
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-md text-center text-white">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold">Make Earth Greener</h2>
            <p className="mt-4 text-lg text-white/80">
              Join thousands of eco-conscious citizens in making waste management smarter and more sustainable.
            </p>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">50K+</p>
                <p className="text-sm text-white/70">Active Users</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">1M+</p>
                <p className="text-sm text-white/70">Items Classified</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">95%</p>
                <p className="text-sm text-white/70">Accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
