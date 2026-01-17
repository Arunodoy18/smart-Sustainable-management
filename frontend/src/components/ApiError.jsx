import React from 'react';

export default function ApiError({ error, onRetry, title = 'Connection Error' }) {
  const getMessage = () => {
    if (!error) return 'An unexpected error occurred.';
    
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Could not connect to the server. Please check your internet connection or try again later.';
    }
    
    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.response?.status === 403) {
      return 'You do not have permission to access this resource.';
    }
    
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (error.response?.status >= 500) {
      return 'The server is experiencing issues. Please try again later.';
    }
    
    return error.response?.data?.detail || error.message || 'An unexpected error occurred.';
  };

  const getIcon = () => {
    if (!error?.response) return '🔌';
    if (error.response?.status === 401) return '🔐';
    if (error.response?.status === 403) return '🚫';
    if (error.response?.status === 404) return '🔍';
    if (error.response?.status >= 500) return '🔧';
    return '⚠️';
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800/50 rounded-2xl border border-red-900/30 backdrop-blur-sm">
      <div className="text-5xl mb-4 animate-bounce">{getIcon()}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-center mb-6 max-w-sm">{getMessage()}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}
