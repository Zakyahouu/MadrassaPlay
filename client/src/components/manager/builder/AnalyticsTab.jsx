// client/src/components/manager/builder/AnalyticsTab.jsx

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MousePointer, Mail, Eye } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../../context/LanguageContext';

const AnalyticsTab = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
    fetchInquiries();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `/api/schools/my-school/landing-page/analytics?period=${period}`
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get('/api/schools/my-school/inquiries?limit=5');
      setInquiries(response.data.inquiries || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  const metrics = [
    {
      label: t.pageViews,
      value: analytics?.today?.pageViews || 0,
      icon: Eye,
      color: 'blue'
    },
    {
      label: t.uniqueVisitors,
      value: analytics?.today?.uniqueVisitors || 0,
      icon: Users,
      color: 'green'
    },
    {
      label: t.ctaClicks,
      value: analytics?.today?.ctaClicks || 0,
      icon: MousePointer,
      color: 'purple'
    },
    {
      label: t.contactSubmissions,
      value: analytics?.today?.contactFormSubmissions || 0,
      icon: Mail,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.analyticsHeader}</h2>
              <p className="text-gray-600">{t.analyticsHeaderDesc}</p>
            </div>
          </div>

          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">{t.last7Days}</option>
            <option value="30">{t.last30Days}</option>
            <option value="90">{t.last90Days}</option>
          </select>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-${metric.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${metric.color}-600`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </div>
            );
          })}
        </div>

        {/* Conversion Rate */}
        {analytics?.today?.conversionRate !== undefined && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {t.conversionRateLabel}: {analytics.today.conversionRate}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Inquiries */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t.recentInquiriesHeader}</h3>
        {inquiries.length > 0 ? (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <div key={inquiry._id} className="border-l-4 border-blue-600 bg-gray-50 p-4 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{inquiry.name}</h4>
                    <p className="text-sm text-gray-600">{inquiry.email}</p>
                    <p className="text-sm text-gray-700 mt-2">{inquiry.message}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${inquiry.status === 'new' ? 'bg-green-100 text-green-800' :
                      inquiry.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {t[inquiry.status] || inquiry.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(inquiry.createdAt).toLocaleString(t.locale || 'en-US')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">{t.noInquiriesYetText}</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;
