import React from 'react';
import UnifiedCard from './UnifiedCard';

const UnifiedStatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'text-blue-600',
  change,
  changeType = 'positive',
  className = ''
}) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-green-600';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return '↗';
    if (changeType === 'negative') return '↘';
    return '→';
  };

  return (
    <UnifiedCard className={className}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center text-xs font-medium mt-1 ${getChangeColor()}`}>
              <span className="mr-1">{getChangeIcon()}</span>
              <span>{change}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </UnifiedCard>
  );
};

export default UnifiedStatsCard;
