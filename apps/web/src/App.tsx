import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
import { DriverDashboard } from '@/pages/driver/DriverDashboard';
import { DriverPickups } from '@/pages/driver/DriverPickups';
import { DriverMap } from '@/pages/driver/DriverMap';

// Admin portal
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminDrivers } from '@/pages/admin/AdminDrivers';

// Error pages
import { NotFoundPage } from '@/pages/NotFoundPage';

function App() {
  return (
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
              <ProtectedRoute allowedRoles={['citizen', 'admin']}>
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
              <ProtectedRoute allowedRoles={['driver', 'admin']}>
                <DashboardLayout variant="driver" />
              </ProtectedRoute>
            }
          >
            <Route index element={<DriverDashboard />} />
            <Route path="pickups" element={<DriverPickups />} />
            <Route path="map" element={<DriverMap />} />
          </Route>

          {/* Admin portal routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout variant="admin" />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* Catch all */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
