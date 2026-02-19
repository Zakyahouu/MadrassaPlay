import React from 'react';
import UnifiedCard from '../../shared/UnifiedCard';
import { useLanguage } from '../../../context/LanguageContext';

const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
  <UnifiedCard
    className="cursor-pointer group"
    onClick={onClick}
    padding="p-4"
  >
    <div className="flex items-start space-x-3">
      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/15 transition-colors">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-text-main-light mb-1">{title}</h4>
        <p className="text-sm text-text-muted-light">{description}</p>
      </div>
    </div>
  </UnifiedCard>
);

export default QuickActionCard;