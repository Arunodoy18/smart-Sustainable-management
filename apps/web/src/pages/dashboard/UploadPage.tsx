/**
 * Upload Page
 * ===========
 * 
 * Waste image upload with AI classification.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import { api } from '@/lib';
import { useUploadStore } from '@/stores';
import { Card, Button, Badge, Progress, Spinner } from '@/components/ui';
import type { Classification } from '@/types';

interface UploadResult {
  entry_id: string;
  classification: Classification;
  points_earned: number;
}

export function UploadPage() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const { uploadProgress, setUploadProgress, setIsUploading } = useUploadStore();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      setIsUploading(true);
      setUploadProgress(0);

      const { data } = await api.post<UploadResult>('/waste/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(percentCompleted);
        },
      });

      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      setIsUploading(false);
    },
    onError: () => {
      setIsUploading(false);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    uploadMutation.reset();
  };

  const getBinInfo = (bin: string) => {
    const bins: Record<string, { color: string; icon: string; bg: string }> = {
      blue: { color: 'text-blue-600', bg: 'bg-blue-100', icon: '♻️' },
      green: { color: 'text-green-600', bg: 'bg-green-100', icon: '🌿' },
      black: { color: 'text-gray-800', bg: 'bg-gray-200', icon: '🗑️' },
      yellow: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⚡' },
      red: { color: 'text-red-600', bg: 'bg-red-100', icon: '☠️' },
    };
    return bins[bin] || bins.black;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Waste Photo</h1>
        <p className="mt-1 text-gray-600">
          Take or upload a photo of your waste for AI classification
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                {isDragActive ? (
                  <CloudArrowUpIcon className="h-8 w-8 text-primary-600" />
                ) : (
                  <PhotoIcon className="h-8 w-8 text-primary-600" />
                )}
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your image here' : 'Drag & drop or click to upload'}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                PNG, JPG or WebP up to 10MB
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Image preview */}
            <Card className="overflow-hidden p-0">
              <div className="relative">
                <img
                  src={preview}
                  alt="Upload preview"
                  className="h-72 w-full object-contain bg-gray-100"
                />
                {!uploadMutation.isPending && !result && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow-lg transition-colors hover:bg-white"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Upload progress */}
              {uploadMutation.isPending && (
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" />
                    <span className="text-sm font-medium text-gray-700">
                      Analyzing image...
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="mt-3" color="primary" />
                </div>
              )}
            </Card>

            {/* Classification result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-primary-200 bg-primary-50/50">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                      <CheckCircleIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Classification Complete!
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        You earned +{result.points_earned} points 🎉
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {/* Category */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Category
                      </p>
                      <p className="mt-1 text-lg font-semibold capitalize text-gray-900">
                        {result.classification.category.replace('_', ' ')}
                      </p>
                      {result.classification.sub_category && (
                        <p className="text-sm text-gray-600">
                          {result.classification.sub_category.replace('_', ' ')}
                        </p>
                      )}
                    </div>

                    {/* Confidence */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Confidence
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant={
                            result.classification.confidence_tier === 'high'
                              ? 'success'
                              : result.classification.confidence_tier === 'medium'
                              ? 'warning'
                              : 'danger'
                          }
                          size="lg"
                        >
                          {Math.round(result.classification.confidence * 100)}%
                        </Badge>
                        <span className="text-sm capitalize text-gray-600">
                          {result.classification.confidence_tier} confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bin recommendation */}
                  <div className="mt-4">
                    <div
                      className={`flex items-center gap-4 rounded-lg p-4 ${
                        getBinInfo(result.classification.recommended_bin).bg
                      }`}
                    >
                      <span className="text-3xl">
                        {getBinInfo(result.classification.recommended_bin).icon}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Dispose in
                        </p>
                        <p
                          className={`text-lg font-bold capitalize ${
                            getBinInfo(result.classification.recommended_bin).color
                          }`}
                        >
                          {result.classification.recommended_bin} Bin
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Handling instructions */}
                  {result.classification.handling_instructions && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Handling Instructions
                      </p>
                      <p className="mt-1 text-gray-700">
                        {result.classification.handling_instructions}
                      </p>
                    </div>
                  )}

                  {/* Low confidence warning */}
                  {result.classification.confidence_tier === 'low' && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          Low Confidence Classification
                        </p>
                        <p className="mt-1 text-sm text-yellow-700">
                          Our AI is less certain about this item. Please verify the
                          classification before disposing. You can also manually
                          correct it if needed.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            navigate(`/dashboard/history?entry=${result.entry_id}`)
                          }
                        >
                          Correct Classification
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!result ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={uploadMutation.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    loading={uploadMutation.isPending}
                    className="flex-1"
                    leftIcon={<CloudArrowUpIcon className="h-5 w-5" />}
                  >
                    Classify Waste
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="flex-1"
                  >
                    Upload Another
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard/history')}
                    className="flex-1"
                  >
                    View History
                  </Button>
                </>
              )}
            </div>

            {/* Error state */}
            {uploadMutation.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-800">Upload Failed</p>
                <p className="mt-1 text-sm text-red-700">
                  Something went wrong. Please try again.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <Card className="mt-8 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Tips for Better Results</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-500">✓</span>
            Ensure good lighting and focus on the waste item
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">✓</span>
            Capture the item against a plain background if possible
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">✓</span>
            If multiple items, focus on one at a time for best accuracy
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">✓</span>
            Clean or rinse recyclables before photographing
          </li>
        </ul>
      </Card>
    </div>
  );
}
