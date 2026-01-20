/**
 * Profile Page
 * ============
 * 
 * User profile management.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tab } from '@headlessui/react';
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import { useAuth, api, cn } from '@/lib';
import { Card, Button, Input, Avatar } from '@/components/ui';

const profileSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      await api.patch('/api/v1/auth/profile', data);
    },
    onSuccess: async () => {
      await refreshUser();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  // Update password mutation
  const updatePassword = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      await api.post('/api/v1/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    updatePassword.mutate(data);
  };

  const tabs = [
    { name: 'Profile', icon: UserCircleIcon },
    { name: 'Security', icon: KeyIcon },
    { name: 'Notifications', icon: BellIcon },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage your profile and preferences
        </p>
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          Changes saved successfully!
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <Avatar
              src={user?.avatar_url}
              name={`${user?.first_name} ${user?.last_name}`}
              size="xl"
              className="mx-auto"
            />
            <h3 className="mt-4 font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium capitalize text-primary-700">
                {user?.role}
              </span>
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
                      selected
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )
                  }
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels>
              {/* Profile Tab */}
              <Tab.Panel>
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your personal details
                  </p>

                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="mt-6 space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="First Name"
                        {...profileForm.register('first_name')}
                        error={profileForm.formState.errors.first_name?.message}
                      />
                      <Input
                        label="Last Name"
                        {...profileForm.register('last_name')}
                        error={profileForm.formState.errors.last_name?.message}
                      />
                    </div>

                    <Input
                      label="Email"
                      value={user?.email || ''}
                      disabled
                      helperText="Email cannot be changed"
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      {...profileForm.register('phone')}
                      error={profileForm.formState.errors.phone?.message}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <textarea
                        {...profileForm.register('address')}
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Enter your address"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        loading={updateProfile.isPending}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Card>
              </Tab.Panel>

              {/* Security Tab */}
              <Tab.Panel>
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Change Password
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your password to keep your account secure
                  </p>

                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="mt-6 space-y-4"
                  >
                    <Input
                      label="Current Password"
                      type="password"
                      {...passwordForm.register('current_password')}
                      error={passwordForm.formState.errors.current_password?.message}
                    />

                    <Input
                      label="New Password"
                      type="password"
                      {...passwordForm.register('new_password')}
                      error={passwordForm.formState.errors.new_password?.message}
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      {...passwordForm.register('confirm_password')}
                      error={passwordForm.formState.errors.confirm_password?.message}
                    />

                    {updatePassword.isError && (
                      <p className="text-sm text-red-600">
                        Failed to update password. Please check your current password.
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        loading={updatePassword.isPending}
                      >
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Card>

                <Card className="mt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Two-Factor Authentication
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </Card>
              </Tab.Panel>

              {/* Notifications Tab */}
              <Tab.Panel>
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notification Preferences
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose how you want to be notified
                  </p>

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        id: 'pickup_updates',
                        label: 'Pickup Updates',
                        description: 'Get notified when your pickup status changes',
                      },
                      {
                        id: 'rewards',
                        label: 'Rewards & Achievements',
                        description: 'Notifications about points and new achievements',
                      },
                      {
                        id: 'tips',
                        label: 'Recycling Tips',
                        description: 'Helpful tips for better waste management',
                      },
                      {
                        id: 'newsletter',
                        label: 'Newsletter',
                        description: 'Monthly updates and environmental news',
                      },
                    ].map((notification) => (
                      <label
                        key={notification.id}
                        className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          defaultChecked
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {notification.label}
                          </p>
                          <p className="text-sm text-gray-500">
                            {notification.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button>Save Preferences</Button>
                  </div>
                </Card>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
}
