// client/src/components/landing/LandingNavigation.jsx

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LandingNavigation = ({ sections, theme, schoolName, logo }) => {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    backgroundColor: theme?.backgroundColor || '#FFFFFF'
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionType) => {
    const element = document.querySelector(`#${sectionType}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  // Build nav items from sections
  const navItems = sections
    .filter(s => s.enabled !== false && s.type !== 'footer')
    .map(s => ({
      id: s.type,
      label: s.data?.title?.split(' ').slice(0, 2).join(' ') || t.landingPage?.nav?.[s.type] || s.type.charAt(0).toUpperCase() + s.type.slice(1)
    }));

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            {logo && (
              <img src={logo} alt={schoolName} className="h-10 w-auto" />
            )}
            <span
              className={`text-xl font-bold ${isScrolled ? 'text-gray-900' : 'text-white'}`}
            >
              {schoolName}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`font-medium transition-colors duration-200 hover:opacity-80 ${isScrolled ? 'text-gray-700' : 'text-white'
                  }`}
              >
                {item.label}
              </button>
            ))}

            {/* CTA Button */}
            <button
              onClick={() => handleNavClick('contact')}
              className="px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: styles.primaryColor }}
            >
              {t.landingPage?.nav?.getStarted || t.getStarted || 'Get Started'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden ${isScrolled ? 'text-gray-900' : 'text-white'}`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => handleNavClick('contact')}
              className="block w-full px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300"
              style={{ backgroundColor: styles.primaryColor }}
            >
              {t.landingPage?.nav?.getStarted || t.getStarted || 'Get Started'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavigation;
