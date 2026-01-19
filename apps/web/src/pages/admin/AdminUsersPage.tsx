/**
 * Admin Users Page
 * ================
 * 
 * User management for administrators.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';

import { api, cn, formatDate } from '@/lib';
import { Card, Button, Input, Badge, Avatar, Modal, Spinner, EmptyState } from '@/components/ui';
import type { User, UserRole, UserStatus } from '@/types';

const ROLES: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'citizen', label: 'Citizen' },
  { value: 'driver', label: 'Driver' },
  { value: 'admin', label: 'Admin' },
];

const STATUSES: { value: UserStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const STATUS_VARIANTS: Record<UserStatus, 'success' | 'secondary' | 'danger'> = {
  active: 'success',
  inactive: 'secondary',
  suspended: 'danger',
};

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', roleFilter, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      
      const { data } = await api.get<User[]>(`/admin/users?${params}`);
      return data;
    },
  });

  // Update user status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      await api.patch(`/admin/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowStatusModal(false);
      setSelectedUser(null);
    },
  });

  // Mock data for demo
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'citizen',
      status: 'active',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'citizen',
      status: 'active',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'driver@example.com',
      first_name: 'Mike',
      last_name: 'Driver',
      role: 'driver',
      status: 'active',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      email: 'suspended@example.com',
      first_name: 'Bob',
      last_name: 'Wilson',
      role: 'citizen',
      status: 'suspended',
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const displayUsers = users || mockUsers;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-gray-600">
            Manage all platform users
          </p>
        </div>
        <Button leftIcon={<UserPlusIcon className="h-5 w-5" />}>
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            leftIcon={<FunnelIcon className="h-4 w-4" />}
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
            }}
          >
            Clear
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : displayUsers.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlassIcon className="h-12 w-12" />}
          title="No users found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {displayUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar_url}
                          name={`${user.first_name} ${user.last_name}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={STATUS_VARIANTS[user.status]} size="sm">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="rounded-full p-1 hover:bg-gray-100">
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={cn(
                                    'block w-full px-4 py-2 text-left text-sm',
                                    active ? 'bg-gray-100' : ''
                                  )}
                                  onClick={() => setSelectedUser(user)}
                                >
                                  View Details
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={cn(
                                    'block w-full px-4 py-2 text-left text-sm',
                                    active ? 'bg-gray-100' : ''
                                  )}
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowStatusModal(true);
                                  }}
                                >
                                  Change Status
                                </button>
                              )}
                            </Menu.Item>
                            {user.status !== 'suspended' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={cn(
                                      'block w-full px-4 py-2 text-left text-sm text-red-600',
                                      active ? 'bg-red-50' : ''
                                    )}
                                    onClick={() => {
                                      setSelectedUser(user);
                                      updateStatus.mutate({ userId: user.id, status: 'suspended' });
                                    }}
                                  >
                                    Suspend User
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                          </div>
                        </Menu.Items>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedUser(null);
        }}
        title="Change User Status"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Update status for <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>
            </p>
            <div className="space-y-2">
              {(['active', 'inactive', 'suspended'] as UserStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus.mutate({ userId: selectedUser.id, status })}
                  disabled={updateStatus.isPending}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-3 transition-colors',
                    selectedUser.status === status
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <span className="font-medium capitalize">{status}</span>
                  <Badge variant={STATUS_VARIANTS[status]} size="sm">
                    {status}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={!!selectedUser && !showStatusModal}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={selectedUser.avatar_url}
                name={`${selectedUser.first_name} ${selectedUser.last_name}`}
                size="xl"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <p className="text-gray-500">{selectedUser.email}</p>
                <div className="mt-2 flex gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-800">
                    {selectedUser.role}
                  </span>
                  <Badge variant={STATUS_VARIANTS[selectedUser.status]} size="sm">
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Joined
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatDate(selectedUser.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Last Updated
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatDate(selectedUser.updated_at)}
                </p>
              </div>
              {selectedUser.phone && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Phone
                  </p>
                  <p className="mt-1 font-medium text-gray-900">{selectedUser.phone}</p>
                </div>
              )}
              {selectedUser.address && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Address
                  </p>
                  <p className="mt-1 font-medium text-gray-900">{selectedUser.address}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowStatusModal(true);
                }}
                className="flex-1"
              >
                Change Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
