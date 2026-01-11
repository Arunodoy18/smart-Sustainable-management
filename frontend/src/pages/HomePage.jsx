import React, { useState, useRef, useEffect } from 'react';
import { wasteAPI, getRealtimeSocket } from '../api';
import Webcam from 'react-webcam';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const { profile } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState(null);
  
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let socket;
    const connect = async () => {
      socket = await getRealtimeSocket();
      if (socket) {
        socket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.event === 'status_update') {
            setStatusUpdate(msg.data);
            // Refresh result if it's the current one
            if (result && result.id === msg.data.id) {
              setResult(prev => ({ ...prev, status: msg.data.status }));
            }
          }
        };
      }
    };
    connect();
    return () => socket?.close();
  }, [result]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowCamera(false);
      setResult(null);
      setError(null);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'captured-waste.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(imageSrc);
          setShowCamera(false);
          setResult(null);
          setError(null);
        });
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      // Get location if possible
      let location = null;
      try {
        const pos = await new Promise((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        console.warn('Geolocation failed', e);
      }

      const response = await wasteAPI.classifyWaste(selectedFile, location);
      setResult(response);
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
        >
          AI Waste <span className="text-green-500">Intelligence</span>
        </motion.h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Instant classification, disposal guidance, and real-time pickup tracking.
        </p>
      </section>

      {/* Capture Section */}
      <div className="bg-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl border border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-2xl hover:border-green-500 hover:bg-gray-700 transition-all group"
          >
            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">📁</span>
            <span className="text-lg font-bold">Upload Image</span>
            <span className="text-sm text-gray-500">Select from gallery</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          <button
            onClick={() => setShowCamera(!showCamera)}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-2xl hover:border-green-500 hover:bg-gray-700 transition-all group"
          >
            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">📸</span>
            <span className="text-lg font-bold">Use Camera</span>
            <span className="text-sm text-gray-500">Capture in real-time</span>
          </button>
        </div>

        <AnimatePresence>
          {showCamera && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 overflow-hidden rounded-2xl relative"
            >
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full"
                videoConstraints={{ facingMode: 'environment' }}
              />
              <button
                onClick={capturePhoto}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 transition-all"
              >
                Take Snapshot
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {previewUrl && (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-gray-700 max-h-[400px]">
              <img src={previewUrl} alt="Preview" className="w-full object-contain bg-gray-900" />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing Waste...
                </>
              ) : 'Identify & Request Collection'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-800 rounded-3xl p-6 sm:p-10 border border-gray-700 shadow-2xl overflow-hidden relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1 capitalize">
                    {result.waste_type} detected
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-900/50 text-green-400 border border-green-800 rounded-full text-xs font-bold uppercase tracking-wider">
                      {(result.confidence_score * 100).toFixed(0)}% Confidence
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                      ${result.status === 'pending' ? 'bg-amber-900/50 text-amber-400 border-amber-800' : 'bg-green-900/50 text-green-400 border-green-800'}
                    `}>
                      {result.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 uppercase font-bold tracking-widest">Risk Level</p>
                  <p className={`text-xl font-black ${result.risk_level === 'high' ? 'text-red-500' : 'text-green-500'}`}>
                    {result.risk_level.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-green-500 font-bold mb-3 flex items-center">
                      <span className="mr-2">💡</span> Recommended Action
                    </h3>
                    <p className="text-xl font-medium text-white">{result.recommended_action}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-green-500 font-bold mb-3 flex items-center">
                      <span className="mr-2">🌍</span> Environmental Impact
                    </h3>
                    <p className="text-gray-300 italic">{result.impact_note}</p>
                  </div>
                </div>

                <div className="bg-green-900/10 rounded-2xl p-6 border border-green-900/30">
                  <h3 className="text-green-400 font-bold mb-4 flex items-center">
                    <span className="mr-2">📝</span> Disposal Instructions
                  </h3>
                  <ul className="space-y-4">
                    {result.instructions.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-gray-900 flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </span>
                        <span className="text-gray-300">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Pickup Tracker Card */}
              <div className="mt-8 p-6 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-800 rounded-full animate-pulse">
                    🚛
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Pickup Coordination</h4>
                    <p className="text-sm text-gray-400">
                      {result.status === 'pending' ? 'Waiting for available driver...' : 'Driver is on the way!'}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-2 w-8 rounded-full ${
                        (result.status === 'pending' && i === 1) || 
                        (result.status === 'accepted' && i <= 2) ||
                        (result.status === 'collected' && i <= 3)
                        ? 'bg-green-500' : 'bg-gray-700'
                      }`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {statusUpdate && !result && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-gray-800 border border-green-500 p-4 rounded-xl shadow-2xl animate-bounce">
          <p className="font-bold">✨ Status Update</p>
          <p className="text-sm text-gray-400">Your waste entry {statusUpdate.id.slice(0, 8)} is now <strong>{statusUpdate.status}</strong></p>
        </div>
      )}
    </div>
  );
}
