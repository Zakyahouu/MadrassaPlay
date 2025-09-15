import React from 'react';

// Generic empty state component
const EmptyState = ({
  icon = '📄',
  title = 'Nothing here yet',
  message = 'There is currently no data to display.',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-dashed border-gray-200 ${className}`}>
      <div className="text-6xl mb-4 select-none flex justify-center" aria-hidden="true">{icon}</div>
      <p className="text-gray-700 font-medium mb-1">{title}</p>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
