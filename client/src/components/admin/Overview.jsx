import { Users, School, Plus, TrendingUp, Settings } from 'lucide-react';
import UnifiedCard from '../shared/UnifiedCard';
import UnifiedStatsCard from '../shared/UnifiedStatsCard';

const Overview = ({ stats, loading, onNavigate }) => {
  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      description: 'Platform utilization',
      change: '+12%',
      changeType: 'positive'
    },
    { 
      title: 'Total Schools', 
      value: stats.totalSchools, 
      icon: School, 
      description: 'Registered institutions',
      change: '+8%',
      changeType: 'positive'
    },
    { 
      title: 'Game Templates', 
      value: stats.totalTemplates, 
      icon: Plus, 
      description: 'Available templates',
      change: '+24%',
      changeType: 'positive'
    }
  ];

  const quickActions = [
    { 
      title: 'Add New School', 
      icon: Plus, 
      description: 'Register new educational institution',
      action: 'schools'
    },
    { 
      title: 'Add Game Template', 
      icon: Plus, 
      description: 'Create new game template',
      action: 'templates'
    },
    { 
      title: 'View Analytics', 
      icon: TrendingUp, 
      description: 'Analyze platform performance',
      action: 'analytics'
    },
    { 
      title: 'Platform Settings', 
      icon: Settings, 
      description: 'Configure system settings',
      action: 'settings',
      comingSoon: true,
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Platform Overview
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Monitor your platform's key metrics and manage core functionalities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <UnifiedCard key={index}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    {stat.change}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                )}
              </div>
            </UnifiedCard>
          );
        })}
      </div>

      <UnifiedCard>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quick Actions
          </h3>
          <p className="text-sm text-gray-600">Streamline your workflow with one-click actions</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            const disabled = action.comingSoon;
            return (
              <button 
                key={index}
                onClick={() => { if (!disabled && onNavigate) onNavigate(action.action); }}
                className={`relative p-4 border border-gray-200 rounded-lg transition-all duration-200 text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-70' : 'hover:bg-gray-50 hover:border-gray-300'}`}
                aria-label={action.title}
                disabled={disabled}
              >
                {disabled && (
                  <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Coming Soon</span>
                )}
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-gray-100 transition-colors">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            );
          })}
        </div>
      </UnifiedCard>

      <UnifiedCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'New school registered', time: '2 minutes ago', icon: School },
            { action: 'Game template uploaded', time: '15 minutes ago', icon: Plus },
            { action: 'User account created', time: '3 hours ago', icon: Users },
            { action: 'Analytics report generated', time: '1 day ago', icon: TrendingUp }
          ].map((activity, index) => {
            const IconComponent = activity.icon;
            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </UnifiedCard>
    </div>
  );
};

export default Overview;