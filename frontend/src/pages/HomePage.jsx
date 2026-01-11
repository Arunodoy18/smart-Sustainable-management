import { useState, useRef } from 'react';
import { wasteAPI, uploadImage } from '../api';
import Webcam from 'react-webcam';

function HomePage() {
  const [userId] = useState(1); // Mock user ID - in production, get from auth
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
      // Upload image (in production, this would go to S3/Azure Blob)
      const uploadResult = await uploadImage(selectedFile);
      
      // Call classification API
      const response = await wasteAPI.classifyWaste(
        userId,
        uploadResult.url,
        { lat: 0, lng: 0 } // Mock location
      );
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to classify waste. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) {
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
        High Confidence ({(confidence * 100).toFixed(0)}%)
      </span>;
    } else if (confidence >= 0.5) {
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
        Medium Confidence ({(confidence * 100).toFixed(0)}%)
      </span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
        Low Confidence ({(confidence * 100).toFixed(0)}%)
      </span>;
    }
  };
  
  const getRiskBadge = (riskLevel) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[riskLevel] || colors.medium}`}>
        {riskLevel.toUpperCase()} RISK
      </span>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Waste Image</h2>
        <p className="text-gray-600 mb-6">
          Take a photo or upload an image of your waste for AI-powered classification and recommendations
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors"
          >
            <span className="text-4xl mb-2">📁</span>
            <span className="text-lg font-medium">Upload Image</span>
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
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors"
          >
            <span className="text-4xl mb-2">📸</span>
            <span className="text-lg font-medium">Use Camera</span>
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
            <h3 className="text-lg font-semibold mb-2">Preview:</h3>
            <img src={previewUrl} alt="Preview" className="w-full max-h-96 object-contain rounded-lg border border-gray-200" />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}
      </div>
      
      {result && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Classification Results</h2>
            
            <div className="flex flex-wrap gap-3 mb-4">
              {getConfidenceBadge(result.classification.confidence)}
              {getRiskBadge(result.waste_entry.risk_level)}
              {result.waste_entry.is_recyclable && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  ♻️ Recyclable
                </span>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Waste Type</p>
                <p className="text-xl font-bold text-gray-900 capitalize">{result.waste_entry.waste_type}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Collection Type</p>
                <p className="text-lg font-semibold text-gray-900">{result.recommendation.collection_type}</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium mb-1">AI Reasoning:</p>
              <p className="text-blue-900">{result.classification.reasoning}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              ✅ Recommended Action: {result.recommendation.action}
            </h3>
            <p className="text-lg text-gray-700 mb-3">{result.recommendation.confidence_message}</p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2">
                {result.recommendation.instructions.map((instruction, idx) => (
                  <li key={idx} className="text-green-800">{instruction}</li>
                ))}
              </ol>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">🌍 Environmental Impact:</h4>
            <p className="text-yellow-800">{result.recommendation.impact}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
