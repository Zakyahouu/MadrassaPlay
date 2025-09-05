import React from 'react';

// Simple loading state component with optional message
const LoadingState = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-gray-500 ${className}`} role="status" aria-live="polite">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-gray-200 border-t-blue-500 mb-4" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default LoadingState;
