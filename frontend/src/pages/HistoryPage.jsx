import { useState, useEffect } from 'react';
import { wasteAPI } from '../api';

function HistoryPage() {
  const [userId] = useState(1); // Mock user ID
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
      const response = await wasteAPI.getUserEntries(userId);
      setEntries(response.entries || []);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };
  
  const viewDetails = async (entryId) => {
    try {
      const response = await wasteAPI.getEntryDetail(entryId);
      setSelectedEntry(response.entry);
    } catch (err) {
      alert('Failed to load entry details');
    }
  };
  
  const getStatusBadge = (status) => {
    if (status === 'collected') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold">✓ Collected</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-semibold">⏳ Pending</span>;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Waste Entry History</h2>
        <p className="text-gray-600 mb-6">
          Track all your waste submissions and collection status
        </p>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}
        
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No waste entries yet</p>
            <p className="text-gray-400 mt-2">Upload your first waste image to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waste Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{entry.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 capitalize">{entry.waste_type}</span>
                      {entry.is_recyclable && <span className="ml-2">♻️</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        entry.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                        entry.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(entry.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        entry.risk_level === 'low' ? 'bg-blue-100 text-blue-800' :
                        entry.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        entry.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {entry.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.recommended_action}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(entry.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => viewDetails(entry.id)}
                        className="text-green-600 hover:text-green-900 font-medium text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Entry Details #{selectedEntry.id}</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Waste Type</p>
                    <p className="font-semibold capitalize">{selectedEntry.waste_type}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Confidence</p>
                    <p className="font-semibold">{(selectedEntry.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Level</p>
                    <p className="font-semibold capitalize">{selectedEntry.risk_level}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Collection Type</p>
                    <p className="font-semibold">{selectedEntry.collection_type}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Recommended Action:</h4>
                  <p className="text-green-800 font-medium">{selectedEntry.recommended_action}</p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedEntry.instructions?.map((instruction, idx) => (
                      <li key={idx} className="text-blue-800">{instruction}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Environmental Impact:</h4>
                  <p className="text-yellow-800">{selectedEntry.impact_note}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p>Created: {new Date(selectedEntry.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    {selectedEntry.collected_at && (
                      <p>Collected: {new Date(selectedEntry.collected_at).toLocaleString()}</p>
                    )}
                  </div>
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
