import React from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  User,
  LogOut,
  Settings,
  Megaphone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const TopNav = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeTab, 
  navigationItems, 
  logout,
  onAdsClick
}) => {
  const { language, toggleLanguage, t, isRTL, isChangingLanguage } = useLanguage();
  const currentTab = navigationItems?.find(item => item.id === activeTab);

  return (
    <div className="bg-white border-b border-gray-200 transition-all duration-300 ease-in-out" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            aria-label="Basculer la barre latérale"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo and Current page title */}
          <div className="flex items-center gap-3">
            <img src="/Logo.jpg" alt="Skill Snap Logo" className="w-8 h-8 object-contain rounded" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentTab?.name || t('dashboard')}
              </h1>
              <p className="text-sm text-gray-500">
                {currentTab?.description || t('manage-dashboard')}
              </p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Language Toggle */}
          <div className="hidden md:flex items-center">
            <button
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 toggle-button ${
                isChangingLanguage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={toggleLanguage}
              disabled={isChangingLanguage}
              title={`Switch to ${language === 'fr' ? 'Arabic' : 'French'}`}
            >
              <span className={`text-xs font-bold ${language === 'fr' ? 'text-indigo-600' : 'text-gray-500'}`}>FR</span>
              <div className="w-6 h-4 bg-gray-200 rounded-full relative">
                <div className={`w-3 h-3 bg-indigo-600 rounded-full absolute top-0.5 toggle-slider ${
                  language === 'ar' ? 'left-3' : 'left-0.5'
                }`}></div>
                {isChangingLanguage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 border border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <span className={`text-xs font-bold ${language === 'ar' ? 'text-indigo-600' : 'text-gray-500'}`}>AR</span>
            </button>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search')}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>

          {/* Announcements trigger removed - AdsBar is rendered below TopNav */}

          {/* Notifications */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <Link
              to="/profile"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              title={t('profile')}
            >
              <User className="w-5 h-5" />
            </Link>
            
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              title={t('logout')}
              aria-label={t('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;