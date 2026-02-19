import React from 'react';
import UnifiedCard from '../../shared/UnifiedCard';
import { useLanguage } from '../../../context/LanguageContext';

const StatsCard = ({ title, value, icon: Icon, color, change }) => (
  <UnifiedCard>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted-light mb-1">{title}</p>
        <p className="text-2xl font-bold text-text-main-light">{value}</p>
        {change && (
          <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </div>
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </UnifiedCard>
);

export default StatsCard;