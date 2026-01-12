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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="card-premium">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Collection Portal</h2>
            <p className="text-gray-400 mt-2 leading-relaxed">
              Verify waste pickups and maintain environmental accountability
            </p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-inner">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <span className="text-3xl">🚛</span>
            </div>
            <div>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active Driver</p>
              <p className="text-xl font-black text-white">{user?.full_name}</p>
            </div>
          </div>
        </div>
        
        {pendingEntries.length === 0 ? (
          <div className="text-center py-24 bg-gray-900/30 rounded-3xl border border-dashed border-gray-700">
            <div className="text-7xl mb-6 opacity-30">✨</div>
            <p className="text-gray-400 text-2xl font-black italic">Route Complete!</p>
            <p className="text-gray-500 mt-2">All pending collections have been handled.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingEntries.map(entry => (
              <div 
                key={entry.id}
                className="group p-6 bg-gray-950/40 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 shadow-lg"
              >
                <div className="flex flex-wrap justify-between items-center gap-6">
                  <div className="flex-1 min-w-[280px]">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                        {entry.waste_type === 'recyclable' ? '♻️' :
                         entry.waste_type === 'organic' ? '🟢' :
                         entry.waste_type === 'e_waste' ? '⚡' : '🗑️'}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white capitalize tracking-tight">
                          {entry.waste_type} Waste
                        </h3>
                        <div className="flex items-center mt-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">{entry.status}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Pick-up Location</p>
                        <p className="text-sm font-bold text-gray-200">{entry.location?.address || 'Designated Area'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Hazard Risk</p>
                        <span className={`px-2.5 py-0.5 text-[10px] rounded-md font-black uppercase tracking-wider risk-${entry.risk_level?.toLowerCase() || 'medium'}`}>
                          {entry.risk_level || 'Medium'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Time Lapsed</p>
                        <p className="text-sm font-bold text-gray-400 italic">
                          {Math.floor((new Date() - new Date(entry.created_at)) / 60000)}m ago
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {entry.status === 'pending' ? (
                      <button
                        onClick={() => handleAccept(entry.id)}
                        className="btn-primary px-10 py-3 text-sm tracking-widest font-black"
                      >
                        ACCEPT ROUTE
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl text-sm tracking-widest font-black transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                      >
                        VERIFY COLLECTION
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
        <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-[60] animate-in zoom-in-95 duration-300">
          <div className="max-w-2xl w-full card-premium p-10 border-white/10 shadow-[0_0_80px_rgba(59,130,246,0.15)]">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">Collection Verification</h3>
                <p className="text-gray-400 mt-1">Proof of work and accountability trail</p>
              </div>
              <button
                onClick={() => {
                  setSelectedEntry(null);
                  setCollectionFile(null);
                  setCollectionPreview(null);
                }}
                className="w-10 h-10 bg-gray-900 hover:bg-rose-900/30 hover:text-rose-400 rounded-full flex items-center justify-center text-gray-500 text-2xl transition-all"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="p-6 bg-gray-900/60 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subject Entry</p>
                  <span className="text-[10px] font-mono text-gray-600">ID: {selectedEntry.id.slice(0,8)}</span>
                </div>
                <p className="text-2xl font-black text-white capitalize">
                  {selectedEntry.waste_type} Waste
                </p>
                <div className="flex items-center mt-3 text-gray-400 text-sm">
                  <span className="mr-4 flex items-center">📍 {selectedEntry.location?.address || 'Site A'}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded font-black uppercase tracking-tighter risk-${selectedEntry.risk_level.toLowerCase()}`}>
                    {selectedEntry.risk_level} Risk
                  </span>
                </div>
              </div>
              
              <div className="relative overflow-hidden p-6 bg-amber-950/20 border border-amber-500/20 rounded-2xl">
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center">
                  <span className="mr-2">⚠️</span> Safety & Verification Protocol
                </h4>
                <ul className="space-y-3">
                  {[
                    'Verify materials match AI classification',
                    'Document collection site condition',
                    `Wear PPE for ${selectedEntry.risk_level.toUpperCase()} risk handling`,
                    'Capture timestamped proof-of-pickup photo'
                  ].map((step, i) => (
                    <li key={i} className="flex items-start text-xs text-amber-100/70 font-medium">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] mr-3 mt-0.5 font-bold italic">{i+1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Collection Proof (Required)
                </label>
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => !collectionPreview && document.getElementById('collection-input').click()}
                >
                  <input
                    id="collection-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {!collectionPreview ? (
                    <div className="py-10 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300">
                      <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner group-hover:scale-110 transition-transform">📸</div>
                      <p className="text-sm font-bold text-gray-300">Tap to Capture Photo</p>
                      <p className="text-[10px] text-gray-500 mt-1">JPEG or PNG, Max 10MB</p>
                    </div>
                  ) : (
                    <div className="relative h-56 group overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                      <img 
                        src={collectionPreview} 
                        alt="Proof" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCollectionFile(null); setCollectionPreview(null); }}
                        className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-2xl transition-all"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-4 left-6">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                          Ready for verification
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    setCollectionFile(null);
                    setCollectionPreview(null);
                  }}
                  className="flex-1 py-4 bg-gray-900 hover:bg-gray-800 text-gray-400 font-bold rounded-xl transition-all border border-gray-700"
                >
                  ABORT
                </button>
                <button
                  onClick={handleConfirmCollection}
                  disabled={isSubmitting || !collectionFile}
                  className="flex-[2] btn-primary py-4 text-sm font-black tracking-[0.2em] bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 disabled:grayscale disabled:opacity-30"
                >
                  {isSubmitting ? 'VERIFYING...' : 'CONFIRM PICKUP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverPage;
