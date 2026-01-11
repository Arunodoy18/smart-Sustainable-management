import { useState, useEffect } from 'react';
import { wasteAPI } from '../api';

function DriverPage() {
  const [driverId] = useState(999); // Mock driver ID
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [collectionImage, setCollectionImage] = useState(null);
  
  useEffect(() => {
    loadPendingEntries();
  }, []);
  
  const loadPendingEntries = async () => {
    try {
      setLoading(true);
      // In production, you'd have a dedicated endpoint for pending pickups
      // For demo, we'll get system-wide analytics and simulate
      const response = await wasteAPI.getAnalytics();
      // Mock pending entries - in real app, fetch from dedicated driver endpoint
      setPendingEntries([
        { id: 1, waste_type: 'plastic', location: 'Building A', user_id: 1, risk_level: 'low' },
        { id: 2, waste_type: 'e-waste', location: 'Building B', user_id: 2, risk_level: 'high' },
      ]);
    } catch (err) {
      console.error('Failed to load pending entries', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkCollected = async () => {
    if (!selectedEntry) return;
    
    try {
      await wasteAPI.markCollected(
        selectedEntry.id,
        driverId,
        collectionImage || null
      );
      
      alert('✅ Collection verified successfully!');
      setSelectedEntry(null);
      setCollectionImage(null);
      loadPendingEntries();
    } catch (err) {
      alert('Failed to mark as collected: ' + err.message);
    }
  };
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCollectionImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending pickups...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Driver Collection Portal</h2>
            <p className="text-gray-600 mt-1">Verify waste pickups and create accountability trail</p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-lg">
            <span className="text-2xl">🚛</span>
            <div>
              <p className="text-xs text-green-600 font-medium">Driver ID</p>
              <p className="text-lg font-bold text-green-900">{driverId}</p>
            </div>
          </div>
        </div>
        
        {pendingEntries.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl">✅</span>
            <p className="text-gray-500 text-lg mt-4">All pickups completed!</p>
            <p className="text-gray-400 mt-2">No pending waste collections</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEntries.map(entry => (
              <div 
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">
                        {entry.waste_type === 'plastic' ? '🔵' :
                         entry.waste_type === 'organic' ? '🟢' :
                         entry.waste_type === 'e-waste' ? '⚡' : '🗑️'}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                          {entry.waste_type} Waste
                        </h3>
                        <p className="text-sm text-gray-600">Entry ID: #{entry.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-medium">{entry.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">User ID</p>
                        <p className="font-medium">{entry.user_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Risk Level</p>
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          entry.risk_level === 'low' ? 'bg-blue-100 text-blue-800' :
                          entry.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          entry.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {entry.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="ml-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Collect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Verify Collection</h3>
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    setCollectionImage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Collecting:</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">
                    {selectedEntry.waste_type} Waste (Entry #{selectedEntry.id})
                  </p>
                  <p className="text-gray-700 mt-1">Location: {selectedEntry.location}</p>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Driver Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-800 text-sm">
                    <li>Verify waste matches reported type</li>
                    <li>Take a clear photo of the collected waste</li>
                    <li>Handle according to risk level: {selectedEntry.risk_level.toUpperCase()}</li>
                    <li>Confirm collection in system</li>
                  </ol>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Collection Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-green-50 file:text-green-700
                      hover:file:bg-green-100"
                  />
                  {collectionImage && (
                    <img 
                      src={collectionImage} 
                      alt="Collection preview" 
                      className="mt-3 w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedEntry(null);
                      setCollectionImage(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkCollected}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    ✓ Confirm Collection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">🎯 Driver Impact Dashboard</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Today's Collections</p>
            <p className="text-3xl font-bold text-blue-900">12</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Pending Pickups</p>
            <p className="text-3xl font-bold text-blue-900">{pendingEntries.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-blue-900">98%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverPage;
