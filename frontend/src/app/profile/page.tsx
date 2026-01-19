'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Edit2,
  Save,
  X,
  Trophy,
  Leaf,
  Recycle,
  Star,
  Award,
  Target
} from 'lucide-react';

const achievements = [
  { id: 1, name: 'First Scan', icon: '🎯', description: 'Complete your first waste classification', earned: true },
  { id: 2, name: 'Eco Warrior', icon: '🌿', description: 'Recycle 50 items', earned: true },
  { id: 3, name: 'Green Streak', icon: '🔥', description: '7-day classification streak', earned: true },
  { id: 4, name: 'Perfect Score', icon: '💯', description: '100% accuracy in a week', earned: false },
  { id: 5, name: 'Carbon Hero', icon: '🌍', description: 'Save 100kg of CO₂', earned: false },
  { id: 6, name: 'Master Recycler', icon: '♻️', description: 'Recycle 500 items', earned: false },
];

const stats = [
  { label: 'Total Scans', value: '234', icon: Target },
  { label: 'Eco Points', value: '2,450', icon: Star },
  { label: 'Items Recycled', value: '189', icon: Recycle },
  { label: 'CO₂ Saved', value: '45kg', icon: Leaf },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: '',
        location: '',
        bio: '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-12"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg shadow-emerald-500/30">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="input-field text-2xl font-bold mb-2"
                />
              ) : (
                <h1 className="text-4xl font-bold text-white mb-2">
                  {user?.full_name || 'User'}
                </h1>
              )}
              <p className="text-sm text-gray-400 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm capitalize">
                  <Trophy className="w-4 h-4" />
                  Level 12
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm capitalize">
                  <Award className="w-4 h-4" />
                  {user?.role || 'user'}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <div>
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-6 text-center hover:scale-105 transition-all duration-300">
                <Icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Profile Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="input-field w-full"
                  />
                ) : (
                  <p className="text-gray-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {formData.phone || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                    className="input-field w-full"
                  />
                ) : (
                  <p className="text-gray-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {formData.location || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Member Since</label>
                <p className="text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  January 2024
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="input-field w-full resize-none"
                  />
                ) : (
                  <p className="text-gray-300">
                    {formData.bio || 'No bio yet. Click edit to add one!'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Achievements
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-xl text-center transition-all ${
                    achievement.earned
                      ? 'bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30'
                      : 'bg-white/5 border border-white/10 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className={`font-medium text-sm ${
                    achievement.earned ? 'text-white' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress to next level</span>
                <span className="text-emerald-400">2,450 / 3,000 XP</span>
              </div>
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '82%' }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity Calendar Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6 mt-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Activity This Year
          </h2>
          
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 52 * 7 }, (_, i) => {
              const intensity = Math.random();
              return (
                <div
                  key={i}
                  className={`w-full aspect-square rounded-sm ${
                    intensity > 0.8
                      ? 'bg-emerald-400'
                      : intensity > 0.6
                      ? 'bg-emerald-500'
                      : intensity > 0.4
                      ? 'bg-emerald-600'
                      : intensity > 0.2
                      ? 'bg-emerald-700'
                      : 'bg-white/5'
                  }`}
                  style={{ display: i < 365 ? 'block' : 'none' }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-white/5" />
              <div className="w-3 h-3 rounded-sm bg-emerald-700" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            </div>
            <span>More</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
