import { Menu, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopNav = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeTab, 
  navigationItems,
  logout
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="ml-4 lg:ml-0 text-xl font-bold text-gray-900">
            {navigationItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link 
            to="/profile" 
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Profile"
          >
            <User className="w-5 h-5" />
          </Link>
          
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopNav;