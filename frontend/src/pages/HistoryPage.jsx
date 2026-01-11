import React, { useState, useEffect } from 'react';
import { wasteAPI } from '../api';
import { motion } from 'framer-motion';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await wasteAPI.getHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center py-20">Loading your history...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Your Impact History</h1>
        <p className="text-gray-400">Track your contributions to a cleaner city.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-lg hover:border-green-500 transition-all flex flex-col"
          >
            <div className="h-48 overflow-hidden relative">
              <img src={entry.image_url} alt={entry.waste_type} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border shadow-lg
                  ${entry.status === 'collected' ? 'bg-green-500 text-gray-900 border-green-400' : 'bg-amber-500 text-gray-900 border-amber-400'}
                `}>
                  {entry.status}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold capitalize">{entry.waste_type} Waste</h3>
                <span className="text-green-500 font-bold">{(entry.confidence_score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2">{entry.impact_note}</p>
              <div className="pt-4 border-t border-gray-700 flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1">
                  📍 {entry.location ? 'Location Logged' : 'No Location'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        {history.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <span className="text-6xl">🌱</span>
            <p className="text-xl text-gray-500">No waste captured yet. Start your recycling journey today!</p>
          </div>
        )}
      </div>
    </div>
  );
}
