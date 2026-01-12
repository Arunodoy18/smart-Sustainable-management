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
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Upload Waste Image</h2>
        <p className="text-gray-400 mb-6">
          Take a photo or upload an image of your waste for AI-powered classification and recommendations
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-green-500 transition-colors bg-gray-750"
          >
            <span className="text-4xl mb-2">📁</span>
            <span className="text-lg font-medium text-white">Upload Image</span>
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
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-green-500 transition-colors bg-gray-750"
          >
            <span className="text-4xl mb-2">📸</span>
            <span className="text-lg font-medium text-white">Use Camera</span>
            <span className="text-sm text-gray-500 mt-1">Take a photo</span>
          </button>
        </div>
        
        {showCamera && (
          <div className="mb-6">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full rounded-lg"
            />
            <button
              onClick={capturePhoto}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Capture Photo
            </button>
          </div>
        )}
        
        {previewUrl && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-white">Preview:</h3>
            <img src={previewUrl} alt="Preview" className="w-full max-h-96 object-contain rounded-lg border border-gray-700" />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : 'Classify Waste'}
            </button>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg">
            <p className="text-red-200 font-medium">❌ {error}</p>
          </div>
        )}
      </div>
      
      {result && (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 border border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Classification Results</h2>
            
            <div className="flex flex-wrap gap-3 mb-4">
              {getConfidenceBadge(result.confidence_score)}
              {getRiskBadge(result.risk_level)}
              {result.is_recyclable && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-900/50 text-green-300 border border-green-800">
                  ♻️ Recyclable
                </span>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-400">Waste Type</p>
                <p className="text-xl font-bold text-white capitalize">{result.waste_type}</p>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-400">Collection Type</p>
                <p className="text-lg font-semibold text-white">{result.collection_type}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-white mb-3">
              ✅ Recommended Action: {result.recommended_action}
            </h3>
            
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-300 mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2">
                {result.instructions.map((instruction, idx) => (
                  <li key={idx} className="text-green-200">{instruction}</li>
                ))}
              </ol>
            </div>
          </div>
          
          <div className="p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-300 mb-2">🌍 Environmental Impact:</h4>
            <p className="text-blue-200">{result.impact_note}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
