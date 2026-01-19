'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Camera,
  Upload,
  Scan,
  Check,
  X,
  Loader2,
  Leaf,
  Trash2,
  Recycle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const wasteCategories = {
  recyclable: {
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    icon: Recycle,
    tips: [
      'Rinse containers before recycling',
      'Remove caps and labels when possible',
      'Flatten cardboard to save space',
    ],
  },
  organic: {
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    icon: Leaf,
    tips: [
      'Can be composted at home',
      'Avoid mixing with non-organic waste',
      'Great for garden fertilizer',
    ],
  },
  hazardous: {
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    icon: AlertTriangle,
    tips: [
      'Never mix with regular trash',
      'Take to designated collection points',
      'Keep in original containers if possible',
    ],
  },
  general: {
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-500/20',
    textColor: 'text-gray-400',
    icon: Trash2,
    tips: [
      'Last resort for non-recyclable items',
      'Consider if it can be reused',
      'Properly bag before disposal',
    ],
  },
};

type WasteCategory = keyof typeof wasteCategories;

interface ClassificationResult {
  category: WasteCategory;
  confidence: number;
  item: string;
  disposal: string;
}

export default function ClassifyPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, token } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
    }
  }, [isAuthenticated, router]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    
    try {
      // Extract base64 data from the data URL
      const base64Data = selectedImage.split(',')[1];
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${API_URL}/api/v1/waste/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64Data }),
      });

      if (!response.ok) {
        throw new Error('Classification failed');
      }

      const data = await response.json();
      
      setResult({
        category: data.category?.toLowerCase() || 'general',
        confidence: data.confidence || 0.85,
        item: data.item || 'Unknown item',
        disposal: data.disposal || 'Dispose in appropriate bin',
      });

      toast.success('Classification complete!');
    } catch (error) {
      toast.error('Classification failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  const categoryInfo = result ? wasteCategories[result.category] : null;
  const CategoryIcon = categoryInfo?.icon;

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            AI Waste <span className="gradient-text">Classification</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Upload or take a photo of your waste item and let our AI instantly classify it for proper disposal
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              className={`card h-[400px] flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                dragActive ? 'border-emerald-500 bg-emerald-500/10' : ''
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Selected waste"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent flex items-center justify-center">
                    <Upload className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Drop your image here
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    or click to browse files
                  </p>
                  <div className="flex gap-3 justify-center">
                    <label className="btn-primary cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                    <label className="btn-secondary cursor-pointer">
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            {selectedImage && !result && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full mt-4 btn-primary disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5 mr-2" />
                    Analyze Waste
                  </>
                )}
              </motion.button>
            )}

            {result && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={reset}
                className="w-full mt-4 btn-secondary"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Scan Another Item
              </motion.button>
            )}
          </motion.div>

          {/* Result Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {result && categoryInfo && CategoryIcon ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card h-[400px] p-6 flex flex-col"
                >
                  {/* Category Badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${categoryInfo.bgColor} w-fit mb-6`}>
                    <CategoryIcon className={`w-5 h-5 ${categoryInfo.textColor}`} />
                    <span className={`font-semibold capitalize ${categoryInfo.textColor}`}>
                      {result.category}
                    </span>
                  </div>

                  {/* Result Details */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {result.item}
                    </h3>
                    <p className="text-gray-400 mb-4">{result.disposal}</p>

                    {/* Confidence */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Confidence</span>
                        <span className="text-emerald-400 font-medium">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full bg-gradient-to-r ${categoryInfo.color} rounded-full`}
                        />
                      </div>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        Disposal Tips
                      </h4>
                      <ul className="space-y-2">
                        {categoryInfo.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Points Earned */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Points Earned</span>
                    <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                      <Sparkles className="w-4 h-4" />
                      +10 Points
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card h-[400px] flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-500/20 to-transparent flex items-center justify-center mb-6">
                    <Scan className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Results will appear here
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Upload an image and click &quot;Analyze Waste&quot; to get classification results
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Category Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Waste Category Guide
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(wasteCategories).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <div key={key} className="card p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${category.color} p-2.5`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="font-semibold text-white capitalize">{key}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {key === 'recyclable' && 'Plastics, glass, metals'}
                    {key === 'organic' && 'Food waste, plants'}
                    {key === 'hazardous' && 'Batteries, chemicals'}
                    {key === 'general' && 'Non-recyclable items'}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
