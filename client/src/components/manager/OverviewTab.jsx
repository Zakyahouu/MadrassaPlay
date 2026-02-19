import React from 'react';
import {
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell,
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import StatsCard from './shared/StatsCard';
import QuickActionCard from './shared/QuickActionCard';
import NotificationItem from './shared/NotificationItem';
import ManagerClassPanel from './shared/ManagerClassPanel';
import ManagerSchoolPanel from './shared/ManagerSchoolPanel';
import UnifiedCard from '../shared/UnifiedCard';

// Overview Tab Component
const OverviewTab = ({ stats, quickActions, notifications, setActiveTab, loading }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton for stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-surface-light rounded-xl border border-border-light p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-6 w-6 bg-slate-200 rounded"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-12"></div>
            </div>
          ))
        ) : (
          stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Management Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Existing Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ManagerClassPanel setActiveTab={setActiveTab} />
            <ManagerSchoolPanel setActiveTab={setActiveTab} />
          </div>

          {/* Quick Actions */}
          <UnifiedCard>
            <h3 className="text-lg font-semibold text-text-main-light mb-4">{t.quickActions}</h3>
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
              <Bell className="w-5 h-5 text-text-muted-light" />
              <h3 className="text-lg font-semibold text-text-main-light">{t.recentNotifications}</h3>
            </div>
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <NotificationItem key={index} {...notification} />
              ))}
            </div>
            <button className="mt-4 text-primary hover:text-primary-hover text-sm font-medium transition-colors">
              {t.comingSoon} →
            </button>
          </UnifiedCard>


        </div>
      </div>
    </div>
  );
};

export default OverviewTab;