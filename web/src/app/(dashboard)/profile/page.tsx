'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  LogOut,
  Shield
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleConfig = {
    user: { label: 'User', color: 'bg-eco-500', icon: '🏠' },
    driver: { label: 'Driver', color: 'bg-status-accepted', icon: '🚛' },
    admin: { label: 'Administrator', color: 'bg-status-pending', icon: '👔' },
  };

  const role = roleConfig[user.role] || roleConfig.user;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-eco-500/20 flex items-center justify-center mb-4">
              <span className="text-4xl text-eco-400 font-semibold">
                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Name */}
            <h2 className="text-xl font-semibold text-white">
              {user.full_name || 'Anonymous User'}
            </h2>

            {/* Role badge */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg">{role.icon}</span>
              <Badge variant="success" size="md">
                {role.label}
              </Badge>
            </div>
          </div>

          {/* Info list */}
          <div className="space-y-4 border-t border-surface-hover pt-6">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-background-secondary">
              <div className="w-10 h-10 rounded-lg bg-eco-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-eco-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-background-secondary">
                <div className="w-10 h-10 rounded-lg bg-eco-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-eco-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="text-white">{user.phone}</p>
                </div>
              </div>
            )}

            {user.address && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-background-secondary">
                <div className="w-10 h-10 rounded-lg bg-eco-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-eco-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <p className="text-white">{user.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-3 rounded-xl bg-background-secondary">
              <div className="w-10 h-10 rounded-lg bg-eco-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-eco-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Member Since</p>
                <p className="text-white">{formatDate(user.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-background-secondary">
              <div className="w-10 h-10 rounded-lg bg-eco-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-eco-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Account Status</p>
                <p className="text-accent-green">
                  {user.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="danger"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="opacity-60">
        <CardContent className="text-center py-4">
          <p className="text-sm text-gray-500">
            Smart Waste Management v1.0.0
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Built for sustainable cities
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
