'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Volume2,
  Eye,
  Lock,
  LogOut,
  Trash2,
  ChevronRight,
  Check
} from 'lucide-react';

const settingsSections = [
  {
    title: 'Account',
    icon: User,
    items: [
      { key: 'email', label: 'Email Notifications', type: 'toggle', value: true },
      { key: 'push', label: 'Push Notifications', type: 'toggle', value: true },
      { key: 'newsletter', label: 'Weekly Newsletter', type: 'toggle', value: false },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { key: 'scan_complete', label: 'Scan Complete Alerts', type: 'toggle', value: true },
      { key: 'achievements', label: 'Achievement Notifications', type: 'toggle', value: true },
      { key: 'tips', label: 'Daily Eco Tips', type: 'toggle', value: true },
      { key: 'sounds', label: 'Sound Effects', type: 'toggle', value: false },
    ],
  },
  {
    title: 'Appearance',
    icon: Palette,
    items: [
      { key: 'theme', label: 'Theme', type: 'select', value: 'dark', options: ['dark', 'light', 'system'] },
      { key: 'animations', label: 'Reduce Animations', type: 'toggle', value: false },
      { key: 'compact', label: 'Compact Mode', type: 'toggle', value: false },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: Shield,
    items: [
      { key: 'analytics', label: 'Share Anonymous Analytics', type: 'toggle', value: true },
      { key: 'location', label: 'Location Services', type: 'toggle', value: false },
      { key: 'data_retention', label: 'Data Retention', type: 'select', value: '1year', options: ['3months', '6months', '1year', 'forever'] },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Initialize settings from sections
    const initialSettings: Record<string, any> = {};
    settingsSections.forEach((section) => {
      section.items.forEach((item) => {
        initialSettings[item.key] = item.value;
      });
    });
    setSettings(initialSettings);
  }, []);

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Settings saved successfully!');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-6 md:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-emerald-400 text-sm font-medium mb-2 tracking-wide">Account</p>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            Settings
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Manage your account preferences and application settings
          </p>
        </motion.div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-12"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">{user?.full_name || 'User'}</h2>
              <p className="text-gray-400 text-sm">{user?.email || 'user@example.com'}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded-full bg-emerald-500/20 text-emerald-400 text-xs capitalize">
                {user?.role || 'user'}
              </span>
            </div>
            <button 
              onClick={() => router.push('/profile')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + sectionIndex * 0.05 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden"
              >
                <div className="flex items-center gap-3 p-5 border-b border-white/5">
                  <Icon className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">{section.title}</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {section.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-gray-300 text-sm">{item.label}</span>
                      {item.type === 'toggle' ? (
                        <button
                          onClick={() => handleToggle(item.key)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            settings[item.key] ? 'bg-emerald-500' : 'bg-white/10'
                          }`}
                        >
                          <motion.div
                            initial={false}
                            animate={{
                              x: settings[item.key] ? 20 : 0,
                            }}
                            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-lg"
                          />
                        </button>
                      ) : item.type === 'select' ? (
                        <select
                          value={settings[item.key] || item.value}
                          onChange={(e) => handleSelect(item.key, e.target.value)}
                          className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg border border-white/10 focus:border-emerald-500 focus:outline-none capitalize"
                        >
                          {item.options?.map((option) => (
                            <option key={option} value={option} className="bg-gray-900">
                              {option.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.03] border border-red-500/20 rounded-2xl overflow-hidden mt-8"
        >
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <Shield className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-white">Danger Zone</h3>
          </div>
          <div className="p-3 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Log out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium">Delete Account</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end mt-8"
        >
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-gray-600 text-sm"
        >
          <p>Smart Waste AI v1.0.0</p>
          <p className="mt-1">Made with 💚 for a greener planet</p>
        </motion.div>
      </div>
    </div>
  );
}
