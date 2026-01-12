import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
      <p className="text-gray-400 font-medium">Loading Smart Waste AI...</p>
    </div>
  );
}

export default LoadingSpinner;
