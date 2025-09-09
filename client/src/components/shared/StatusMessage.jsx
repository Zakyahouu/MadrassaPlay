import React from 'react';

// Inline, dismissible status message (success / error / info / warning)
const variantStyles = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-800'
};

const StatusMessage = ({ variant = 'info', title, message, onClose, className = '', children }) => {
  const style = variantStyles[variant] || variantStyles.info;
  return (
    <div className={`relative rounded-md border p-4 mb-4 ${style} ${className}`} role="alert" aria-live="polite">
      <div className="pr-6">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        {message && <p className="text-sm leading-snug">{message}</p>}
        {children}
      </div>
      {onClose && (
        <button
          aria-label="Dismiss message"
          className="absolute top-2 right-2 text-xs px-2 py-1 rounded hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1"
          onClick={onClose}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default StatusMessage;
