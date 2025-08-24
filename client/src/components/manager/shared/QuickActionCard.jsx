import React from 'react';
import UnifiedCard from '../../shared/UnifiedCard';

const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
  <UnifiedCard 
    className="cursor-pointer group"
    onClick={onClick}
    padding="p-4"
  >
    <div className="flex items-start space-x-3">
      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-gray-100 transition-colors">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </UnifiedCard>
);

export default QuickActionCard;