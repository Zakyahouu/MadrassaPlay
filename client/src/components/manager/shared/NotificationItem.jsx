
import React from 'react';
import { Clock } from 'lucide-react';

const NotificationItem = ({ message, time, type }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${getTypeColor()} hover:bg-opacity-75 transition-colors`}>
      <p className="text-sm text-gray-900 mb-1">{message}</p>
      <div className="flex items-center text-xs text-gray-500">
        <Clock className="w-3 h-3 mr-1" />
        {time}
      </div>
    </div>
  );
};

export default NotificationItem;