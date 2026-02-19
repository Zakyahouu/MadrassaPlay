import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

// Simple loading state component with optional message
const LoadingState = ({ message, className = '' }) => {
  const { t } = useLanguage();
  const displayMessage = message || t.loading || 'Loading...';

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`} role="status" aria-live="polite">
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-border-light border-t-primary mb-4" />
      <p className="text-sm font-medium text-text-muted-light">{displayMessage}</p>
    </div>
  );
};

export default LoadingState;
