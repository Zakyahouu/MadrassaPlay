import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = () => {
    const { language, setLanguage, supportedLanguages } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = supportedLanguages.find((l) => l.code === language);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-main-light bg-surface-light border border-border-light rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                title="Change language"
            >
                <Globe className="w-4 h-4" />
                <span>{currentLang?.flag}</span>
                <span className="hidden sm:inline">{currentLang?.nativeName}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-surface-light rounded-lg shadow-lg border border-border-light py-1 z-50 animate-in fade-in slide-in-from-top-1">
                    {supportedLanguages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${language === lang.code
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-text-main-light hover:bg-slate-50'
                                }`}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span>{lang.nativeName}</span>
                            {language === lang.code && (
                                <span className="ml-auto text-primary">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
