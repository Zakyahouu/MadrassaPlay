import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageTransitionOverlay = () => {
  const { isChangingLanguage, language } = useLanguage();

  if (!isChangingLanguage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 language-overlay">
      <div className="flex flex-col items-center space-y-4">
        {/* Logo */}
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center animate-pulse">
          <img src="/Logo.jpg" alt="Skill Snap Logo" className="w-12 h-12 object-contain rounded-lg" />
        </div>
        
        {/* Loading spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        
        {/* Language indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-md border toggle-button">
            <span className={`text-sm font-bold ${language === 'fr' ? 'text-gray-500' : 'text-indigo-600'}`}>FR</span>
            <div className="w-6 h-4 bg-gray-200 rounded-full relative">
              <div className={`w-3 h-3 bg-indigo-600 rounded-full absolute top-0.5 toggle-slider ${
                language === 'ar' ? 'left-3' : 'left-0.5'
              }`}></div>
            </div>
            <span className={`text-sm font-bold ${language === 'ar' ? 'text-gray-500' : 'text-indigo-600'}`}>AR</span>
          </div>
        </div>
        
        {/* Loading text */}
        <p className="text-sm text-gray-600 font-medium">
          {language === 'fr' ? 'Changement de langue...' : 'تغيير اللغة...'}
        </p>
      </div>
    </div>
  );
};

export default LanguageTransitionOverlay;
