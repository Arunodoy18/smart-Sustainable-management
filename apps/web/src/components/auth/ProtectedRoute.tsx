/**
 * Protected Route Component
 * =========================
 * 
 * Route wrapper for authenticated routes with role-based access.
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/lib/auth';
import { LoadingPage } from '@/components/ui';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingPage />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects: Record<UserRole, string> = {
      citizen: '/dashboard',
      driver: '/driver',
      admin: '/admin',
    };
    return <Navigate to={roleRedirects[user.role]} replace />;
  }

  return <>{children}</>;
}
