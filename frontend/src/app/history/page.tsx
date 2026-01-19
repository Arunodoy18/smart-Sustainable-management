'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  History,
  Search,
  Filter,
  Calendar,
  Download,
  ChevronDown,
  Recycle,
  Leaf,
  Trash2,
  AlertTriangle,
  Eye,
  X,
  Check
} from 'lucide-react';

interface HistoryItem {
  id: string;
  item: string;
  category: 'recyclable' | 'organic' | 'general' | 'hazardous';
  confidence: number;
  date: string;
  time: string;
  image?: string;
  disposal: string;
  points: number;
}

const historyItems: HistoryItem[] = [];

const categoryConfig = {
  recyclable: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: Recycle,
  },
  organic: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: Leaf,
  },
  general: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    icon: Trash2,
  },
  hazardous: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    icon: AlertTriangle,
  },
};

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, router]);

  const filteredHistory = historyItems.filter((item) => {
    const matchesSearch = item.item.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPoints = historyItems.reduce((sum, item) => sum + item.points, 0);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <History className="w-8 h-8 text-emerald-400" />
              Classification <span className="gradient-text">History</span>
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              View all your past waste classifications
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <button className="btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </motion.div>
        </div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-white">{historyItems.length}</div>
            <div className="text-sm text-gray-500">Total Scans</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{totalPoints}</div>
            <div className="text-sm text-gray-500">Points Earned</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {historyItems.filter(h => h.category === 'recyclable').length}
            </div>
            <div className="text-sm text-gray-500">Recycled</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {historyItems.filter(h => h.category === 'organic').length}
            </div>
            <div className="text-sm text-gray-500">Composted</div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12 w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'recyclable', 'organic', 'general', 'hazardous'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* History List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card divide-y divide-white/5"
        >
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item, index) => {
              const config = categoryConfig[item.category];
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">{item.item}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${config.bgColor} ${config.color} capitalize`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{item.date}</span>
                      <span>{item.time}</span>
                      <span className="text-emerald-400">+{item.points} pts</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="hidden md:block text-right">
                    <div className="text-sm text-gray-400">Confidence</div>
                    <div className="text-white font-medium">
                      {(item.confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* View Button */}
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <Eye className="w-5 h-5 text-gray-400" />
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </motion.div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="card max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedItem.item}</h2>
                    <p className="text-gray-500">{selectedItem.date} at {selectedItem.time}</p>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Category */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className={`px-3 py-1 rounded-full capitalize ${
                      categoryConfig[selectedItem.category].bgColor
                    } ${categoryConfig[selectedItem.category].color}`}>
                      {selectedItem.category}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">AI Confidence</span>
                      <span className="text-white font-medium">
                        {(selectedItem.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        style={{ width: `${selectedItem.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Disposal */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Disposal</span>
                    <span className="text-white">{selectedItem.disposal}</span>
                  </div>

                  {/* Points */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Points Earned</span>
                    <span className="text-emerald-400 font-medium">+{selectedItem.points}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-sm text-gray-500">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Classification verified
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
