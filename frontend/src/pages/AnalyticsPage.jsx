import { useState, useEffect } from 'react';
import { wasteAPI } from '../api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AnalyticsPage() {
  const [userId] = useState(1); // Mock user ID - null for system-wide
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('user'); // 'user' or 'system'
  
  useEffect(() => {
    loadAnalytics();
  }, [viewMode]);
  
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await wasteAPI.getAnalytics(viewMode === 'user' ? userId : null);
      setAnalytics(response.analytics);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  if (!analytics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }
  
  // Prepare data for charts
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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Waste Management Analytics</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('user')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'user' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Stats
            </button>
            <button
              onClick={() => setViewMode('system')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'system' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              System-Wide
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <p className="text-green-600 text-sm font-medium mb-1">Total Entries</p>
            <p className="text-3xl font-bold text-green-900">{analytics.total_waste_entries}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <p className="text-blue-600 text-sm font-medium mb-1">Recyclable Items</p>
            <p className="text-3xl font-bold text-blue-900">{analytics.recyclable_count}</p>
            <p className="text-xs text-blue-600 mt-1">{analytics.recycling_rate}% recycling rate</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <p className="text-purple-600 text-sm font-medium mb-1">Collected</p>
            <p className="text-3xl font-bold text-purple-900">{analytics.collected_count}</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
            <p className="text-orange-600 text-sm font-medium mb-1">Avg Confidence</p>
            <p className="text-3xl font-bold text-orange-900">{(analytics.average_confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Waste Categories</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">No category data available</p>
            )}
          </div>
          
          {/* Collection Status */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Collection Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Environmental Impact Summary */}
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-3">🌍 Environmental Impact Summary</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Items Properly Sorted</p>
              <p className="text-2xl font-bold text-green-700">{analytics.recyclable_count}</p>
              <p className="text-xs text-gray-500 mt-1">Prevents contamination</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recycling Rate</p>
              <p className="text-2xl font-bold text-blue-700">{analytics.recycling_rate}%</p>
              <p className="text-xs text-gray-500 mt-1">Above average!</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CO₂ Reduction (est.)</p>
              <p className="text-2xl font-bold text-purple-700">{(analytics.recyclable_count * 2.5).toFixed(1)} kg</p>
              <p className="text-xs text-gray-500 mt-1">Through proper recycling</p>
            </div>
          </div>
        </div>
        
        {/* SDG Alignment */}
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-3">🎯 SDG Alignment</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏙️</span>
              <div>
                <p className="font-semibold">SDG 11: Sustainable Cities and Communities</p>
                <p className="text-sm text-gray-600">Smart waste management for urban sustainability</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">🍃</span>
              <div>
                <p className="font-semibold">SDG 12: Responsible Consumption and Production</p>
                <p className="text-sm text-gray-600">Reducing waste through proper segregation</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">🌍</span>
              <div>
                <p className="font-semibold">SDG 13: Climate Action</p>
                <p className="text-sm text-gray-600">Lowering GHG emissions through recycling</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
