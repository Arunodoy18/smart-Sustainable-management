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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="card-premium">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Environmental Impact</h2>
            <p className="text-gray-400 mt-2 leading-relaxed">
              Real-time insights into your sustainability contributions
            </p>
          </div>
          <button 
            onClick={loadAnalytics}
            className="p-3 bg-gray-900/50 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition-all duration-300 border border-emerald-500/20 flex items-center justify-center"
          >
            <span className="mr-2">🔄</span> Refresh Data
          </button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-6 bg-gray-900/60 rounded-2xl border border-white/5 shadow-inner group hover:border-emerald-500/30 transition-all duration-300">
            <p className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Total Entries</p>
            <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{analytics.total_waste_entries}</p>
          </div>
          
          <div className="p-6 bg-gray-900/60 rounded-2xl border border-white/5 shadow-inner group hover:border-blue-500/30 transition-all duration-300">
            <p className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Recyclable</p>
            <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{analytics.recyclable_count}</p>
            <p className="text-[10px] font-bold text-blue-400 mt-2 uppercase tracking-tighter">{analytics.recycling_rate}% conversion rate</p>
          </div>
          
          <div className="p-6 bg-gray-900/60 rounded-2xl border border-white/5 shadow-inner group hover:border-purple-500/30 transition-all duration-300">
            <p className="text-xs font-black text-purple-500 uppercase tracking-[0.2em] mb-2">Collected</p>
            <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{analytics.collected_count}</p>
          </div>
          
          <div className="p-6 bg-gray-900/60 rounded-2xl border border-white/5 shadow-inner group hover:border-amber-500/30 transition-all duration-300">
            <p className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Avg Confidence</p>
            <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{(analytics.average_confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="p-8 bg-gray-900/40 rounded-2xl border border-white/5 shadow-lg">
            <h3 className="text-lg font-black text-white mb-8 flex items-center">
              <span className="p-2 bg-emerald-500/20 rounded-lg mr-3">🍰</span>
              Waste Categories
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="p-8 bg-gray-900/40 rounded-2xl border border-white/5 shadow-lg">
            <h3 className="text-lg font-black text-white mb-8 flex items-center">
              <span className="p-2 bg-blue-500/20 rounded-lg mr-3">📊</span>
              Collection Efficiency
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Environmental Impact Summary */}
        <div className="mt-12 relative overflow-hidden rounded-3xl bg-emerald-950/20 border border-emerald-500/20 p-10">
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-emerald-400 mb-8 flex items-center">
              <span className="p-3 bg-emerald-500/20 rounded-2xl mr-4 text-3xl">🌍</span>
              Sustainability Report
            </h3>
            <div className="grid md:grid-cols-3 gap-12 mb-10">
              <div className="space-y-2">
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Properly Sorted</p>
                <p className="text-5xl font-black text-white leading-none">{analytics.recyclable_count}</p>
                <p className="text-sm text-emerald-100/60 font-medium">Items diverted from landfill</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Recycling Score</p>
                <p className="text-5xl font-black text-white leading-none">{analytics.recycling_rate}%</p>
                <p className="text-sm text-blue-100/60 font-medium italic">Elite contributor status</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-purple-500 uppercase tracking-widest">CO₂ Offset</p>
                <p className="text-5xl font-black text-white leading-none">{(analytics.recyclable_count * 2.5).toFixed(1)} <span className="text-xl">kg</span></p>
                <p className="text-sm text-purple-100/60 font-medium">Estimated carbon reduction</p>
              </div>
            </div>
            <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <p className="text-emerald-100 font-medium italic leading-relaxed text-center italic">
                "{analytics.impact_summary}"
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -ml-32 -mb-32" />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
