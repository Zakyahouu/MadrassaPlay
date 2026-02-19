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
import LanguageSwitcher from './LanguageSwitcher';

const TopNav = ({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  navigationItems,
  logout,
  onAdsClick
}) => {
  const { t, isRTL } = useLanguage();
  const currentTab = navigationItems?.find(item => item.id === activeTab);

  return (
    <div className="bg-surface-light border-b border-border-light transition-all duration-300 ease-in-out" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-text-muted-light hover:text-text-main-light hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Basculer la barre latérale"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo and Current page title */}
          <div className="flex items-center gap-3">
            <div className="icon-badge">
              <span className="material-icons-outlined text-lg">school</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-main-light leading-tight">
                {currentTab?.name || t.dashboard}
              </h1>
              <p className="text-xs text-text-muted-light">
                {currentTab?.description || t.manageDashboard}
              </p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <div className="hidden md:flex items-center">
            <LanguageSwitcher />
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted-light" />
              <input
                type="text"
                placeholder={t.search}
                className="pl-10 pr-4 py-1.5 border border-border-light bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm text-text-main-light placeholder-slate-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>

          {/* Announcements trigger removed - AdsBar is rendered below TopNav */}

          {/* Notifications */}
          <button className="p-2 text-text-muted-light hover:text-text-main-light hover:bg-slate-50 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label={t.notifications}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-surface-light"></span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <Link
              to="/profile"
              className="p-2 text-text-muted-light hover:text-text-main-light hover:bg-slate-50 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              title={t.profile}
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={logout}
              className="p-2 text-text-muted-light hover:text-text-main-light hover:bg-slate-50 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              title={t.logout}
              aria-label={t.logout}
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