import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Layouts
import { MainLayout } from '@/components/layouts/MainLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

// Public pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// User dashboard
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { UploadPage } from '@/pages/dashboard/UploadPage';
import { HistoryPage } from '@/pages/dashboard/HistoryPage';
import { RewardsPage } from '@/pages/dashboard/RewardsPage';
import { PickupsPage } from '@/pages/dashboard/PickupsPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';

// Driver portal
import { DriverDashboardPage } from '@/pages/driver/DriverDashboardPage';
import { DriverPickupsPage } from '@/pages/driver/DriverPickupsPage';
import { DriverMapPage } from '@/pages/driver/DriverMapPage';

// Admin portal
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminDriversPage } from '@/pages/admin/AdminDriversPage';

// Error pages
import { NotFoundPage } from '@/pages/NotFoundPage';

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            {/* Public routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* User dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="rewards" element={<RewardsPage />} />
              <Route path="pickups" element={<PickupsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Driver portal routes */}
            <Route
              path="/driver"
              element={
                <ProtectedRoute allowedRoles={['DRIVER', 'ADMIN']}>
                  <DashboardLayout variant="driver" />
                </ProtectedRoute>
              }
            >
              <Route index element={<DriverDashboardPage />} />
              <Route path="pickups" element={<DriverPickupsPage />} />
              <Route path="map" element={<DriverMapPage />} />
            </Route>

            {/* Admin portal routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DashboardLayout variant="admin" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="drivers" element={<AdminDriversPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          
          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
