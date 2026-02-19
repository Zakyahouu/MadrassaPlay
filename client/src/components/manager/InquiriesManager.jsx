// client/src/components/manager/InquiriesManager.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useLanguage } from '../../context/LanguageContext';
import {
  Mail, Phone, Calendar, Clock, CheckCircle,
  AlertCircle, Filter, Search, Download
} from 'lucide-react';

const InquiriesManager = () => {
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, new, contacted, in_progress, converted, archived
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [filter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await axios.get('/api/schools/my-school/inquiries', { params });
      setInquiries(response.data.inquiries || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/schools/my-school/inquiries/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateInquiryStatus = async (inquiryId, status, notes = '') => {
    try {
      await axios.patch(`/api/schools/my-school/inquiries/${inquiryId}`, {
        status,
        notes
      });
      fetchInquiries();
      fetchStats();
      setSelectedInquiry(null);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      alert(t.failUpdateInquiry);
    }
  };

  const exportInquiries = async () => {
    try {
      const response = await axios.get('/api/schools/my-school/landing-page/analytics/export', {
        params: { period: 30 },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inquiries-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting inquiries:', error);
      alert(t.failExportInquiries);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      inquiry.name.toLowerCase().includes(searchLower) ||
      inquiry.email.toLowerCase().includes(searchLower) ||
      inquiry.message.toLowerCase().includes(searchLower)
    );
  });

  const statusColors = {
    new: 'bg-green-100 text-green-800 border-green-200',
    contacted: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    converted: 'bg-purple-100 text-purple-800 border-purple-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.contactInquiries}</h1>
        <p className="text-gray-600">{t.manageLeadsLandingPage}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">{t.totalInquiries}</div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="text-2xl font-bold text-green-900">{stats.new}</div>
            <div className="text-sm text-green-700">{t.new}</div>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <div className="text-2xl font-bold text-blue-900">{stats.contacted}</div>
            <div className="text-sm text-blue-700">{t.contacted}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <div className="text-2xl font-bold text-yellow-900">{stats.in_progress}</div>
            <div className="text-sm text-yellow-700">{t.in_progress}</div>
          </div>
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
            <div className="text-2xl font-bold text-purple-900">{stats.converted}</div>
            <div className="text-sm text-purple-700">{t.converted}</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-500" />
            {['all', 'new', 'contacted', 'in_progress', 'converted', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {t[status] || status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchInquiriesPlaceholder}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={exportInquiries}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />{t.export}</button>
          </div>
        </div>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredInquiries.length > 0 ? (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <div
              key={inquiry._id}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedInquiry(inquiry)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{inquiry.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {inquiry.email}
                    </div>
                    {inquiry.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {inquiry.phone}
                      </div>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[inquiry.status]}`}>
                  {t[inquiry.status] || inquiry.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{inquiry.message}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(inquiry.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                {inquiry.respondedAt && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    {t.responded}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t.noInquiriesFound}</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t.inquiryDetails}</h2>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
                <p className="text-gray-900">{selectedInquiry.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                  <p className="text-gray-900">{selectedInquiry.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                  <p className="text-gray-900">{selectedInquiry.phone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.message}</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedInquiry.message}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.currentStatus}</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[selectedInquiry.status]}`}>
                  {t[selectedInquiry.status] || selectedInquiry.status.replace('_', ' ')}
                </span>
              </div>

              {selectedInquiry.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
                  <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{selectedInquiry.notes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.updateStatus}</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => updateInquiryStatus(selectedInquiry._id, 'contacted')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t.markAsContacted}
                  </button>
                  <button
                    onClick={() => updateInquiryStatus(selectedInquiry._id, 'in_progress')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    {t.in_progress}
                  </button>
                  <button
                    onClick={() => updateInquiryStatus(selectedInquiry._id, 'converted')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {t.markAsConverted}
                  </button>
                  <button
                    onClick={() => updateInquiryStatus(selectedInquiry._id, 'archived')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    {t.archive}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiriesManager;
