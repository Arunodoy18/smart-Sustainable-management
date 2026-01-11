import React, { useState, useEffect, useRef } from 'react';
import { wasteAPI, getRealtimeSocket } from '../api';
import { useAuth } from '../context/AuthContext';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverPage() {
  const { profile } = useAuth();
  const [pendingPickups, setPendingPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [collectionFile, setCollectionFile] = useState(null);
  const [collectionPreview, setCollectionPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const webcamRef = useRef(null);

  useEffect(() => {
    fetchPickups();
    
    let socket;
    const connect = async () => {
      socket = await getRealtimeSocket();
      if (socket) {
        socket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.event === 'new_pickup') {
            setPendingPickups(prev => [msg.data, ...prev]);
          }
        };
      }
    };
    connect();
    return () => socket?.close();
  }, []);

  const fetchPickups = async () => {
    try {
      const data = await wasteAPI.getPendingPickups();
      setPendingPickups(data);
    } catch (err) {
      console.error('Failed to fetch pickups', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (job) => {
    try {
      await wasteAPI.acceptPickup(job.id);
      setActiveJob({ ...job, status: 'accepted' });
      setPendingPickups(prev => prev.filter(p => p.id !== job.id));
    } catch (err) {
      alert('Failed to accept job');
    }
  };

  const captureProof = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'proof.jpg', { type: 'image/jpeg' });
          setCollectionFile(file);
          setCollectionPreview(imageSrc);
          setShowCamera(false);
        });
    }
  };

  const handleCollect = async () => {
    if (!collectionFile) {
      alert('Please provide proof of collection');
      return;
    }
    setSubmitting(true);
    try {
      let location = null;
      try {
        const pos = await new Promise((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {}

      await wasteAPI.collectWaste(activeJob.id, collectionFile, location);
      alert('✅ Pickup verified and completed!');
      setActiveJob(null);
      setCollectionFile(null);
      setCollectionPreview(null);
    } catch (err) {
      alert('Failed to verify collection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading pickups...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>
          <p className="text-gray-400">Manage real-time pickups and verification.</p>
        </div>
        <div className="bg-green-900/20 border border-green-800 px-4 py-2 rounded-xl text-green-400 font-bold">
          Active Driver: {profile?.full_name}
        </div>
      </header>

      {activeJob ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 rounded-3xl p-6 sm:p-10 border-2 border-green-500 shadow-2xl"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="bg-green-500 text-gray-900 px-3 py-1 rounded-full text-xs font-black uppercase mb-2 inline-block">Active Job</span>
              <h2 className="text-2xl font-bold capitalize">{activeJob.waste_type} Pickup</h2>
              <p className="text-gray-400 text-sm">ID: {activeJob.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
              <p className="text-lg font-medium">{activeJob.location ? `${activeJob.location.lat.toFixed(4)}, ${activeJob.location.lng.toFixed(4)}` : 'On-site'}</p>
            </div>
          </div>

          <div className="space-y-6">
            {!collectionPreview ? (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 text-center space-y-4">
                <p className="text-gray-400">Step: Upload proof of collection image to verify.</p>
                {showCamera ? (
                  <div className="space-y-4">
                    <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded-xl mx-auto max-w-sm" />
                    <button onClick={captureProof} className="bg-green-500 text-white px-8 py-3 rounded-full font-bold">Capture Proof</button>
                  </div>
                ) : (
                  <button onClick={() => setShowCamera(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-bold transition-all">
                    Open Camera for Proof
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <img src={collectionPreview} alt="Proof" className="w-full h-48 object-cover rounded-2xl border border-gray-700" />
                <button onClick={() => setCollectionPreview(null)} className="text-sm text-red-400 underline">Retake Photo</button>
              </div>
            )}

            <button
              onClick={handleCollect}
              disabled={submitting || !collectionFile}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Complete Collection'}
            </button>
          </div>
        </motion.div>
      ) : (
        <section className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Available Pickups ({pendingPickups.length})
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {pendingPickups.map(pickup => (
                <motion.div
                  key={pickup.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex justify-between items-center hover:border-gray-600 transition-all"
                >
                  <div className="flex gap-4 items-center">
                    <div className="text-4xl">
                      {pickup.waste_type === 'recyclable' ? '♻️' : pickup.waste_type === 'hazardous' ? '⚠️' : '🗑️'}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg capitalize">{pickup.waste_type} Waste</h4>
                      <p className="text-sm text-gray-500">
                        Requested {new Date(pickup.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAccept(pickup)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                  >
                    Accept
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {pendingPickups.length === 0 && (
              <div className="bg-gray-800/50 p-12 rounded-3xl border border-dashed border-gray-700 text-center">
                <p className="text-gray-500 text-lg italic">No pending pickups. You're all caught up!</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
