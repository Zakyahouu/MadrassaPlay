import React from 'react';
import UnifiedCard from '../../shared/UnifiedCard';

const StatsCard = ({ title, value, icon: Icon, color, change }) => (
  <UnifiedCard>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </div>
      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </UnifiedCard>
);

export default StatsCard;