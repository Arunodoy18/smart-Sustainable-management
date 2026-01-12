import { useState, useEffect } from 'react';
import { wasteAPI } from '../api';
import { useAuth } from '../context/AuthContext';

function DriverPage() {
  const { user } = useAuth();
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [collectionFile, setCollectionFile] = useState(null);
  const [collectionPreview, setCollectionPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    loadPendingEntries();
  }, []);
  
  const loadPendingEntries = async () => {
    try {
      setLoading(true);
      const response = await wasteAPI.getPending();
      setPendingEntries(response || []);
    } catch (err) {
      console.error('Failed to load pending entries', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAccept = async (entryId) => {
    try {
      await wasteAPI.acceptPickup(entryId);
      alert('Pickup accepted! Please proceed to the location.');
      loadPendingEntries();
    } catch (err) {
      alert('Failed to accept pickup: ' + (err.response?.data?.detail || err.message));
    }
  };
  
  const handleConfirmCollection = async () => {
    if (!selectedEntry || !collectionFile) {
      alert('Please upload a proof photo first');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await wasteAPI.collectWaste(
        selectedEntry.id,
        collectionFile,
        { lat: 0, lng: 0 } // Mock location
      );
      
      alert('✅ Collection verified successfully!');
      setSelectedEntry(null);
      setCollectionFile(null);
      setCollectionPreview(null);
      loadPendingEntries();
    } catch (err) {
      alert('Failed to mark as collected: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCollectionFile(file);
      setCollectionPreview(URL.createObjectURL(file));
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading pending pickups...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Driver Collection Portal</h2>
            <p className="text-gray-400 mt-1">Verify waste pickups and create accountability trail</p>
          </div>
          <div className="flex items-center space-x-3 px-4 py-2 bg-green-900/30 border border-green-800 rounded-lg">
            <span className="text-2xl">🚛</span>
            <div>
              <p className="text-xs text-green-400 font-medium">Driver</p>
              <p className="text-lg font-bold text-white">{user?.full_name}</p>
            </div>
          </div>
        </div>
        
        {pendingEntries.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl">✅</span>
            <p className="text-gray-500 text-lg mt-4">All pickups completed!</p>
            <p className="text-gray-400 mt-2">No pending waste collections at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEntries.map(entry => (
              <div 
                key={entry.id}
                className="bg-gray-700/30 border border-gray-600 rounded-lg p-5 hover:border-green-500 transition-colors"
              >
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">
                        {entry.waste_type === 'recyclable' ? '♻️' :
                         entry.waste_type === 'organic' ? '🟢' :
                         entry.waste_type === 'e_waste' ? '⚡' : '🗑️'}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize">
                          {entry.waste_type} Waste
                        </h3>
                        <p className="text-xs text-gray-400">Status: {entry.status}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Location</p>
                        <p className="text-sm font-medium text-gray-200">{entry.location?.address || 'Building A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Risk Level</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold capitalize ${
                          entry.risk_level === 'low' ? 'bg-blue-900/30 text-blue-300' :
                          entry.risk_level === 'medium' ? 'bg-yellow-900/30 text-yellow-300' :
                          'bg-red-900/30 text-red-300'
                        }`}>
                          {entry.risk_level}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Submitted</p>
                        <p className="text-sm text-gray-300">{new Date(entry.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {entry.status === 'pending' ? (
                      <button
                        onClick={() => handleAccept(entry.id)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Collect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-white">Verify Collection</h3>
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    setCollectionFile(null);
                    setCollectionPreview(null);
                  }}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Collecting:</p>
                  <p className="text-xl font-bold text-white capitalize">
                    {selectedEntry.waste_type} Waste
                  </p>
                  <p className="text-gray-300 mt-1">Location: {selectedEntry.location?.address || 'Main Entrance'}</p>
                </div>
                
                <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                  <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Driver Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-yellow-200 text-sm">
                    <li>Verify waste matches reported type</li>
                    <li>Take a clear photo of the collected waste</li>
                    <li>Ensure safety gear is worn for {selectedEntry.risk_level.toUpperCase()} risk items</li>
                    <li>Confirm collection in system to complete</li>
                  </ol>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Collection Proof (Photo)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-green-600 file:text-white
                      hover:file:bg-green-700"
                  />
                  {collectionPreview && (
                    <div className="mt-4 relative">
                      <img 
                        src={collectionPreview} 
                        alt="Collection preview" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-600 shadow-inner"
                      />
                      <button 
                        onClick={() => {setCollectionFile(null); setCollectionPreview(null);}}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedEntry(null);
                      setCollectionFile(null);
                      setCollectionPreview(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCollection}
                    disabled={isSubmitting || !collectionFile}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Confirming...' : '✓ Confirm Collection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverPage;
