import { useState, useEffect } from 'react';
import { wasteAPI } from '../api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadAnalytics();
  }, []);
  
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await wasteAPI.getAnalytics();
      setAnalytics(response);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  if (!analytics || analytics.total_waste_entries === 0) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-10 text-center border border-gray-700">
        <p className="text-gray-400 text-lg">No analytics data available yet.</p>
        <p className="text-gray-500 mt-2">Submit your first waste entry to see the impact!</p>
      </div>
    );
  }
  
  const categoryData = Object.entries(analytics.category_breakdown || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));
  
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  const statusData = [
    { name: 'Collected', value: analytics.collected_count || 0 },
    { name: 'Pending', value: analytics.pending_count || 0 }
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Waste Management Analytics</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
            <p className="text-green-400 text-sm font-medium mb-1">Total Entries</p>
            <p className="text-3xl font-bold text-white">{analytics.total_waste_entries}</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
            <p className="text-blue-400 text-sm font-medium mb-1">Recyclable Items</p>
            <p className="text-3xl font-bold text-white">{analytics.recyclable_count}</p>
            <p className="text-xs text-blue-300 mt-1">{analytics.recycling_rate}% recycling rate</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
            <p className="text-purple-400 text-sm font-medium mb-1">Collected</p>
            <p className="text-3xl font-bold text-white">{analytics.collected_count}</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
            <p className="text-orange-400 text-sm font-medium mb-1">Avg Confidence</p>
            <p className="text-3xl font-bold text-white">{(analytics.average_confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-4">Waste Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-4">Collection Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                <Legend />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Environmental Impact Summary */}
        <div className="mt-8 p-6 bg-green-900/20 border border-green-800 rounded-lg">
          <h3 className="text-lg font-bold text-green-400 mb-3">🌍 Environmental Impact Summary</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400">Items Properly Sorted</p>
              <p className="text-2xl font-bold text-green-300">{analytics.recyclable_count}</p>
              <p className="text-xs text-gray-500 mt-1">Prevents contamination</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Recycling Rate</p>
              <p className="text-2xl font-bold text-blue-300">{analytics.recycling_rate}%</p>
              <p className="text-xs text-gray-500 mt-1">Above local average</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">CO₂ Reduction (est.)</p>
              <p className="text-2xl font-bold text-purple-300">{(analytics.recyclable_count * 2.5).toFixed(1)} kg</p>
              <p className="text-xs text-gray-500 mt-1">Through proper recycling</p>
            </div>
          </div>
          <p className="mt-4 text-green-200 italic text-sm font-medium border-t border-green-800/50 pt-4">
            {analytics.impact_summary}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
