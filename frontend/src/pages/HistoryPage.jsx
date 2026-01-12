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
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Waste Entry History</h2>
        <p className="text-gray-400 mb-6">
          Track all your waste submissions and collection status
        </p>
        
        {error && (
          <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg mb-4">
            <p className="text-red-200">❌ {error}</p>
          </div>
        )}
        
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No waste entries yet</p>
            <p className="text-gray-400 mt-2">Upload your first waste image to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Waste Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-gray-700">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-white capitalize">{entry.waste_type}</span>
                      {entry.is_recyclable && <span className="ml-2">♻️</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        entry.confidence_score >= 0.8 ? 'bg-green-900/30 text-green-300' :
                        entry.confidence_score >= 0.5 ? 'bg-yellow-900/30 text-yellow-300' :
                        'bg-red-900/30 text-red-300'
                      }`}>
                        {(entry.confidence_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold capitalize ${
                        entry.risk_level === 'low' ? 'bg-blue-900/30 text-blue-300' :
                        entry.risk_level === 'medium' ? 'bg-yellow-900/30 text-yellow-300' :
                        'bg-red-900/30 text-red-300'
                      }`}>
                        {entry.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(entry.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="text-green-500 hover:text-green-400 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white">Entry Details</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400">Waste Type</p>
                        <p className="font-semibold text-white capitalize">{selectedEntry.waste_type}</p>
                      </div>
                      <div className="p-3 bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400">Confidence</p>
                        <p className="font-semibold text-white">{(selectedEntry.confidence_score * 100).toFixed(0)}%</p>
                      </div>
                      <div className="p-3 bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400">Risk Level</p>
                        <p className="font-semibold text-white capitalize">{selectedEntry.risk_level}</p>
                      </div>
                      <div className="p-3 bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400">Collection</p>
                        <p className="font-semibold text-white">{selectedEntry.collection_type}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-900/30 border border-green-800 rounded-lg">
                      <h4 className="font-semibold text-green-300 mb-2">Recommended Action:</h4>
                      <p className="text-green-200">{selectedEntry.recommended_action}</p>
                    </div>
                  </div>
                  
                  <div>
                    <img 
                      src={getImageUrl(selectedEntry.image_url)} 
                      alt="Waste" 
                      className="w-full rounded-lg border border-gray-700 shadow-lg"
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedEntry.instructions?.map((instruction, idx) => (
                      <li key={idx} className="text-blue-200">{instruction}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="p-4 bg-gray-700 rounded-lg text-sm text-gray-300">
                  <p>Created: {new Date(selectedEntry.created_at).toLocaleString()}</p>
                  {selectedEntry.collected_at && (
                    <p className="mt-1">Collected: {new Date(selectedEntry.collected_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
