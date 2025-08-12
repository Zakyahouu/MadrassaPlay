import React from 'react';
import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import StatsCard from './shared/StatsCard';
import QuickActionCard from './shared/QuickActionCard';
import NotificationItem from './shared/NotificationItem'; 
import ManagerClassPanel from './shared/ManagerClassPanel';
import ManagerSchoolPanel from './shared/ManagerSchoolPanel';
import UnifiedCard from '@shared/UnifiedCard';

// Overview Tab Component
const OverviewTab = ({ stats, quickActions, notifications, setActiveTab }) => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Management Panels */}
      <div className="lg:col-span-2 space-y-6">
        {/* Existing Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ManagerClassPanel />
          <ManagerSchoolPanel />
        </div>

        {/* Quick Actions */}
        <UnifiedCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </UnifiedCard>
      </div>

      {/* Right Column - Notifications & Recent Activity */}
      <div className="space-y-6">
        {/* Notifications */}
        <UnifiedCard>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          </div>
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <NotificationItem key={index} {...notification} />
            ))}
          </div>
          <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
            View all notifications →
          </button>
        </UnifiedCard>

        {/* Today's Schedule */}
        <UnifiedCard>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-900">Staff Meeting</span>
              <span className="text-gray-500">9:00 AM</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-900">Parent Conference</span>
              <span className="text-gray-500">2:00 PM</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-900">Faculty Review</span>
              <span className="text-gray-500">4:30 PM</span>
            </div>
          </div>
          <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
            View full calendar →
          </button>
        </UnifiedCard>
      </div>
    </div>
  </div>
);

export default OverviewTab;