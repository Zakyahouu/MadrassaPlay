import { Users, School, Plus, TrendingUp, Settings } from 'lucide-react';

const Overview = ({ stats, loading }) => {
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
      action: 'settings'
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
            <div 
              key={index} 
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <IconComponent className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
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
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quick Actions
          </h3>
          <p className="text-sm text-gray-600">Streamline your workflow with one-click actions</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button 
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <IconComponent className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
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
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <IconComponent className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Overview;