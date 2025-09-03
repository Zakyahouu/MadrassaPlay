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

const TopNav = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeTab, 
  navigationItems, 
  logout,
  onAdsClick
}) => {
  const currentTab = navigationItems?.find(item => item.id === activeTab);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Current page title */}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentTab?.name || 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-500">
              {currentTab?.description || 'Manage your dashboard'}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Announcements */}
          {onAdsClick && (
            <button 
              onClick={onAdsClick}
              className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
              title="View Announcements"
            >
              <Megaphone className="w-5 h-5" />
            </button>
          )}

          {/* Notifications */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <Link
              to="/profile"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </Link>
            
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
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