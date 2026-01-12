import { useState, useRef } from 'react';
import { wasteAPI } from '../api';
import Webcam from 'react-webcam';

function HomePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  
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
      // Convert base64 to file
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(imageSrc);
          setShowCamera(false);
          setResult(null);
          setError(null);
        });
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select or capture an image first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Call classification API (Multipart upload)
      const response = await wasteAPI.classifyWaste(
        selectedFile,
        { lat: 0, lng: 0 } // Mock location
      );
      
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to classify waste. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const getConfidenceBadge = (confidence) => {
    const score = confidence || 0;
    if (score >= 0.8) {
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
        High Confidence ({(score * 100).toFixed(0)}%)
      </span>;
    } else if (score >= 0.5) {
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
        Medium Confidence ({(score * 100).toFixed(0)}%)
      </span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
        Low Confidence ({(score * 100).toFixed(0)}%)
      </span>;
    }
  };
  
  const getRiskBadge = (riskLevel) => {
    const level = riskLevel?.toLowerCase() || 'medium';
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[level] || colors.medium}`}>
        {level.toUpperCase()} RISK
      </span>
    );
  };
  
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="card-premium">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <span className="text-2xl">♻️</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Upload Waste Image</h2>
          </div>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Take a photo or upload an image of your waste for AI-powered classification and recommendations
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => fileInputRef.current.click()}
              className="group flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-700 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gray-900/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📁</span>
              </div>
              <span className="text-lg font-semibold text-white">Upload Image</span>
              <span className="text-sm text-gray-500 mt-1">Click to select file</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => setShowCamera(!showCamera)}
              className="group flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-700 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gray-900/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📸</span>
              </div>
              <span className="text-lg font-semibold text-white">Use Camera</span>
              <span className="text-sm text-gray-500 mt-1">Take a photo</span>
            </button>
          </div>
          
          {showCamera && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-gray-700 bg-black">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full"
              />
              <div className="p-4 bg-gray-900/80 backdrop-blur-sm">
                <button
                  onClick={capturePhoto}
                  className="btn-primary w-full"
                >
                  Capture Photo
                </button>
              </div>
            </div>
          )}
          
          {previewUrl && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Preview:</h3>
                <button 
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                  className="text-sm text-gray-500 hover:text-rose-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="relative group overflow-hidden rounded-2xl border border-gray-700 shadow-2xl">
                <img src={previewUrl} alt="Preview" className="w-full max-h-[500px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full py-4 text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing Waste...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🔍</span> Classify Waste
                  </span>
                )}
              </button>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-rose-900/20 border border-rose-800/50 rounded-xl animate-shake">
              <p className="text-rose-400 font-medium flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </p>
            </div>
          )}
        </div>
        
        {result && (
          <div className="card-premium space-y-8 animate-in zoom-in-95 duration-500">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Results</h2>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    result.confidence_score >= 0.8 ? 'confidence-high' : 
                    result.confidence_score >= 0.5 ? 'confidence-medium' : 'confidence-low'
                  }`}>
                    {result.confidence_score >= 0.8 ? 'High' : 
                     result.confidence_score >= 0.5 ? 'Medium' : 'Low'} Confidence
                  </span>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider risk-${result.risk_level?.toLowerCase() || 'medium'}`}>
                    {result.risk_level || 'Medium'} Risk
                  </span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 bg-gray-900/60 rounded-2xl border border-white/5 shadow-inner">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Waste Type</p>
                  <p className="text-2xl font-black text-emerald-400 capitalize">{result.waste_type}</p>
                </div>
                <div className="p-5 bg-gray-900/60 rounded-2xl border border-white/5 shadow-inner">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Collection</p>
                  <p className="text-xl font-bold text-white">{result.collection_type}</p>
                </div>
                <div className="p-5 bg-gray-900/60 rounded-2xl border border-white/5 shadow-inner flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Recyclable</p>
                    <p className={`text-xl font-bold ${result.is_recyclable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {result.is_recyclable ? 'Yes' : 'No'}
                    </p>
                  </div>
                  {result.is_recyclable && <span className="text-3xl">♻️</span>}
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-2xl bg-emerald-950/20 border border-emerald-800/30 p-8 shadow-lg">
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-emerald-300 mb-4 flex items-center">
                  <span className="p-2 bg-emerald-500/20 rounded-lg mr-3">✅</span>
                  Action: {result.recommended_action}
                </h3>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-emerald-500/80 uppercase tracking-widest">Steps to take:</h4>
                  <ul className="grid gap-3">
                    {result.instructions.map((instruction, idx) => (
                      <li key={idx} className="flex items-start text-emerald-100/90 leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold mr-3 mt-0.5 border border-emerald-500/30">
                          {idx + 1}
                        </span>
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
            </div>
            
            <div className="p-6 bg-blue-950/20 border border-blue-800/30 rounded-2xl flex items-start space-x-4">
              <span className="text-2xl mt-1">🌍</span>
              <div>
                <h4 className="font-bold text-blue-300 mb-1 tracking-tight">Environmental Impact</h4>
                <p className="text-blue-100/80 leading-relaxed text-sm">{result.impact_note}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );

}

export default HomePage;
