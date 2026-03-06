import { createContext, useContext, useState, useEffect } from 'react';
import { translations, supportedLanguages } from '../lib/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const [isRTL, setIsRTL] = useState(() => {
    return (localStorage.getItem('language') || 'en') === 'ar';
  });

  // Keep isChangingLanguage for backward compatibility (always false now)
  const isChangingLanguage = false;

  const toggleLanguage = () => {
    // Legacy support: cycle through en -> ar -> fr -> en
    const order = ['en', 'ar', 'fr'];
    const idx = order.indexOf(language);
    setLanguage(order[(idx + 1) % order.length]);
  };

  useEffect(() => {
    localStorage.setItem('language', language);
    const rtl = language === 'ar';
    setIsRTL(rtl);
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (rtl) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language]);

  // t is the translations object for current language — supports property access
  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, supportedLanguages, toggleLanguage, isChangingLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
