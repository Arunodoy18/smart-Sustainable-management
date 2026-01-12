import { useState, useEffect } from 'react';
import { wasteAPI } from '../api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const SERVER_URL = API_BASE_URL.replace('/api/v1', '');

function HistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  useEffect(() => {
    loadEntries();
  }, []);
  
  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await wasteAPI.getHistory();
      setEntries(response || []);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };
  
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${SERVER_URL}${url}`;
  };
  
  const getStatusBadge = (status) => {
    if (status === 'collected') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-300 border border-green-800 font-semibold">✓ Collected</span>;
    }
    if (status === 'accepted') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-900/50 text-blue-300 border border-blue-800 font-semibold">Accepted</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-800 font-semibold">⏳ Pending</span>;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="card-premium">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Waste History</h2>
            <p className="text-gray-400 mt-2 leading-relaxed">
              Track your waste submissions and collection journey
            </p>
          </div>
          <button 
            onClick={loadEntries}
            className="p-3 bg-gray-900/50 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition-all duration-300 border border-emerald-500/20 flex items-center justify-center"
          >
            <span className="mr-2">🔄</span> Refresh
          </button>
        </div>
        
        {error && (
          <div className="p-4 bg-rose-900/20 border border-rose-800/50 rounded-xl mb-6 animate-shake">
            <p className="text-rose-400 font-medium flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </p>
          </div>
        )}
        
        {entries.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-dashed border-gray-700">
            <div className="text-6xl mb-4 opacity-20">📋</div>
            <p className="text-gray-400 text-xl font-medium italic">Your history is looking clean!</p>
            <p className="text-gray-500 mt-2">Upload your first waste entry to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-950/20 shadow-inner">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-gray-900/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Waste Type</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Confidence</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Risk Level</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map(entry => (
                    <tr key={entry.id} className="group hover:bg-white/[0.02] transition-colors duration-300">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-base font-bold text-white capitalize">{entry.waste_type}</span>
                          {entry.is_recyclable && (
                            <span className="ml-2.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-md uppercase tracking-tighter">♻️ Recyclable</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-lg font-bold tracking-tight ${
                          entry.confidence_score >= 0.8 ? 'confidence-high' :
                          entry.confidence_score >= 0.5 ? 'confidence-medium' :
                          'confidence-low'
                        }`}>
                          {(entry.confidence_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-lg font-bold uppercase tracking-widest risk-${entry.risk_level?.toLowerCase() || 'medium'}`}>
                          {entry.risk_level || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">{getStatusBadge(entry.status)}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="px-4 py-2 text-xs font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/10 rounded-lg transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {selectedEntry && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="max-w-4xl w-full card-premium p-0 overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.1)]">
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img 
                src={getImageUrl(selectedEntry.image_url)} 
                alt="Waste" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent" />
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xl transition-all"
              >
                ×
              </button>
              <div className="absolute bottom-6 left-8">
                <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-md mb-2 inline-block">Entry Details</span>
                <h3 className="text-3xl font-black text-white capitalize tracking-tight">
                  {selectedEntry.waste_type}
                </h3>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Confidence</p>
                  <p className="text-xl font-bold text-white">{(selectedEntry.confidence_score * 100).toFixed(0)}%</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Risk Level</p>
                  <p className="text-xl font-bold text-white capitalize">{selectedEntry.risk_level}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Recyclable</p>
                  <p className="text-xl font-bold text-white">{selectedEntry.is_recyclable ? 'Yes' : 'No'}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Collection</p>
                  <p className="text-xl font-bold text-white">{selectedEntry.collection_type}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em]">Action Plan</h4>
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                    <p className="text-emerald-100 font-medium leading-relaxed">{selectedEntry.recommended_action}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em]">Instructions</h4>
                  <ul className="space-y-3">
                    {selectedEntry.instructions?.map((instruction, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-400 leading-relaxed">
                        <span className="w-5 h-5 flex-shrink-0 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded flex items-center justify-center mr-3 mt-0.5 italic">{idx + 1}</span>
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                  <span className="mr-4">📅 {new Date(selectedEntry.created_at).toLocaleString()}</span>
                  <span>📍 {selectedEntry.location?.address || 'Local Region'}</span>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="btn-primary py-2 px-8"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
