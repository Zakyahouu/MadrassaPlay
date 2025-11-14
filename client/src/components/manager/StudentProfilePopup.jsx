import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, GraduationCap, QrCode, BookOpen, 
  CreditCard, Calendar, Clock, Star,
  Plus, Edit, Download, X, Building2, CheckCircle, XCircle,
  AlertCircle, Clock as ClockIcon, History, ArrowLeftRight, PauseCircle, PlayCircle, FileText
} from 'lucide-react';
import axios from 'axios';
import formatDZ from '../../utils/currency';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';
import PaymentModal from '../shared/PaymentModal';

const getAuthToken = () => {
  const userInfoString = localStorage.getItem('user');
  if (!userInfoString) return null;
  try {
    const userInfo = JSON.parse(userInfoString);
    return userInfo?.token || null;
  } catch (error) {
    console.error("Failed to parse userInfo", error);
    return null;
  }
};

const StudentProfilePopup = ({ student, isOpen, onClose, onRefresh, onEdit }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDebt, setTotalDebt] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  // Enrollment modal state
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classQuery, setClassQuery] = useState('');
  const [classType, setClassType] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isEnrollLoading, setIsEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [actionError, setActionError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionModal, setActionModal] = useState({ type: null, enrollment: null });
  const [actionForm, setActionForm] = useState({ reason: '', targetClassId: '' });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [transferClasses, setTransferClasses] = useState([]);
  const actionTitles = {
    transfer: 'Transfer Enrollment',
    suspend: 'Suspend Enrollment',
    unenroll: 'Unenroll From Class'
  };

  useEffect(() => {
    if (isOpen && student?._id) {
      fetchStudentData();
    }
  }, [isOpen, student?._id]);

  // Load available classes when opening enrollment modal
  useEffect(() => {
    const loadAvailable = async () => {
      if (!showEnrollModal) return;
      setEnrollError('');
      setIsEnrollLoading(true);
      try {
        const token = getAuthToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Prefer enriched endpoint with availability info
        const { data: classesData } = await axios.get('/api/enrollments/available-classes', config);
        setAvailableClasses(Array.isArray(classesData) ? classesData : []);
      } catch (e) {
        // Fallback to /api/classes
        try {
          const token = getAuthToken();
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const { data: classesData } = await axios.get('/api/classes', config);
          setAvailableClasses(Array.isArray(classesData) ? classesData : []);
        } catch (err) {
          console.error('Failed to load classes for enrollment', err);
          setEnrollError(err.response?.data?.message || 'Failed to load classes');
          setAvailableClasses([]);
        }
      } finally {
        setIsEnrollLoading(false);
      }
    };
    loadAvailable();
  }, [showEnrollModal]);

  const fetchStudentData = async () => {
    setIsLoading(true);
    setHistoryLoading(true);
    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const historyPromise = axios
        .get(`/api/students/${student._id}/history`, { ...config, params: { limit: 100 } })
        .then((res) => res.data)
        .catch((err) => {
          console.error('Failed to fetch student history', err);
          return { timeline: [] };
        });

      const debtPromise = axios
        .get(`/api/payments/student-debt/${student._id}`, config)
        .catch((err) => {
          console.error('Failed to fetch student debt', err);
          return null;
        });

      const [enrollmentsRes, paymentsRes, debtRes, historyData] = await Promise.all([
        axios.get(`/api/enrollments/student/${student._id}`, config),
        axios.get(`/api/students/${student._id}/payments`, config),
        debtPromise,
        historyPromise
      ]);

      const enrollList = Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : [];
  const paymentList = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      setEnrollments(enrollList);
      setPayments(paymentList);
  const fetchedDebt = debtRes?.data?.data?.debt;
  setTotalDebt(Number.isFinite(fetchedDebt) ? fetchedDebt : 0);
      setHistory(Array.isArray(historyData?.timeline) ? historyData.timeline : []);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setEnrollments([]);
      setPayments([]);
      setHistory([]);
    } finally {
      setIsLoading(false);
      setHistoryLoading(false);
    }
  };

  const loadTransferClasses = async () => {
    try {
      const token = getAuthToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/enrollments/available-classes', config);
      setTransferClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load transfer classes', err);
      setTransferClasses([]);
      setActionError(err.response?.data?.message || 'Failed to load classes');
    }
  };

  const openActionModal = (type, enrollment) => {
    setActionError('');
    setActionForm({ reason: '', targetClassId: '' });
    setActionModal({ type, enrollment });
    if (type === 'transfer') {
      loadTransferClasses();
    }
  };

  const closeActionModal = () => {
    setActionModal({ type: null, enrollment: null });
    setTransferClasses([]);
    setActionError('');
  };

  const submitAction = async (event) => {
    event.preventDefault();
    if (!actionModal?.type || !actionModal?.enrollment) return;
    setActionError('');
    setActionSubmitting(true);
    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      if (actionModal.type === 'transfer') {
        if (!actionForm.targetClassId) {
          setActionError('Please select a target class');
          setActionSubmitting(false);
          return;
        }
        await axios.post(`/api/students/${student._id}/transfer`, {
          fromEnrollmentId: actionModal.enrollment._id,
          toClassId: actionForm.targetClassId,
          reason: actionForm.reason?.trim() || undefined,
        }, config);
      } else if (actionModal.type === 'suspend') {
        if (!actionForm.reason?.trim()) {
          setActionError('Reason is required');
          setActionSubmitting(false);
          return;
        }
        await axios.post(`/api/students/${student._id}/suspend`, {
          enrollmentId: actionModal.enrollment._id,
          reason: actionForm.reason.trim(),
        }, config);
      } else if (actionModal.type === 'unenroll') {
        await axios.post(`/api/students/${student._id}/unenroll`, {
          enrollmentId: actionModal.enrollment._id,
          reason: actionForm.reason?.trim() || undefined,
        }, config);
      }
      closeActionModal();
      await fetchStudentData();
    } catch (err) {
      console.error('Student action failed', err);
      setActionError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleUnsuspend = async (enrollment) => {
    if (!enrollment?._id) return;
    if (!window.confirm('Unsuspend this enrollment?')) return;
    setActionError('');
    try {
      const token = getAuthToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`/api/students/${student._id}/unsuspend`, { enrollmentId: enrollment._id }, config);
      await fetchStudentData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to unsuspend enrollment');
    }
  };

  const openPrintableReceipt = (payment) => {
    const printable = payment?.receiptMeta?.printable;
    if (!printable) {
      setActionError('Receipt data is not available for this payment.');
      return;
    }
    const receiptWindow = window.open('', '_blank', 'width=720,height=900');
    if (!receiptWindow) {
      setActionError('Please allow pop-ups to view the receipt.');
      return;
    }
    const issuedAt = printable?.issuedAt || payment?.receiptMeta?.issuedAt || payment?.createdAt;
    const formattedDate = issuedAt ? new Date(issuedAt).toLocaleString() : new Date().toLocaleString();
    const debtDelta = typeof printable?.payment?.debtDelta === 'number'
      ? printable.payment.debtDelta
      : (typeof payment?.debtDelta === 'number' ? payment.debtDelta : 0);
    const debtImpactLabel = debtDelta > 0
      ? 'School owes student'
      : debtDelta < 0
        ? 'Student owes school'
        : 'No change';
    const debtImpactDisplay = debtDelta > 0
      ? `+${formatDZ(debtDelta)}`
      : debtDelta < 0
        ? `-${formatDZ(Math.abs(debtDelta))}`
        : formatDZ(0);
    const expectedPrice = printable?.payment?.expectedPrice ?? payment?.expectedPrice ?? payment?.amount ?? 0;
    const amountTaken = printable?.payment?.taken ?? payment?.taken ?? payment?.amount ?? 0;
    const paymentAmount = printable?.payment?.amount ?? payment?.amount ?? expectedPrice;
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Receipt ${payment?.receiptNumber || ''}</title>
        <style>
          body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 32px; color: #111827; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .section { margin-top: 24px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
          .card { padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #E5E7EB; }
          .footer { margin-top: 32px; font-size: 12px; color: #6B7280; }
        </style>
      </head>
      <body>
        <h1>Payment Receipt</h1>
        <p>Receipt #: <strong>${payment?.receiptNumber || 'N/A'}</strong></p>
        <p>Date: ${formattedDate}</p>

        <div class="section">
          <div class="grid">
            <div class="card">
              <h3>School</h3>
              <p>${printable?.school?.name || '—'}</p>
              <p>${printable?.school?.contact?.address || ''}</p>
              <p>${printable?.school?.contact?.phone || ''}</p>
            </div>
            <div class="card">
              <h3>Student</h3>
              <p>${printable?.student?.name || '—'} (${printable?.student?.code || '—'})</p>
              <p>${printable?.student?.contact?.phone1 || ''}</p>
            </div>
            <div class="card">
              <h3>Class</h3>
              <p>${printable?.class?.name || '—'}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${printable?.payment?.kind || 'Payment'}</td>
                <td>${formatDZ(paymentAmount)}</td>
                <td>${printable?.payment?.method || 'cash'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="card">
            <h3>Financial Breakdown</h3>
            <p>Expected price: <strong>${formatDZ(expectedPrice)}</strong></p>
            <p>Amount received: <strong>${formatDZ(amountTaken)}</strong></p>
            <p>Debt impact: <strong>${debtImpactDisplay}</strong> <span style="color:#6B7280">(${debtImpactLabel})</span></p>
          </div>
        </div>

        <div class="footer">
          Issued by ${printable?.cashier?.name || 'Manager'} (${printable?.cashier?.role || 'staff'})
        </div>
      </body>
    </html>`;
    receiptWindow.document.write(html);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  const markAttendance = async (enrollmentId, status) => {
    try {
      const date = new Date().toISOString().slice(0,10);
      await axios.post('/api/attendance/mark', { enrollmentId, date, status });
      await fetchStudentData();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const formatSchedule = (schedules) => {
    if (!Array.isArray(schedules)) return '';
    return schedules.map(s => `${s.dayOfWeek?.[0]?.toUpperCase()}${s.dayOfWeek?.slice(1)} ${s.startTime}-${s.endTime}`).join(', ');
  };

  const isTodayClass = (schedules) => {
    if (!Array.isArray(schedules)) return false;
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const today = days[new Date().getDay()];
    return schedules.some(s => s.dayOfWeek === today);
  };

  const getEducationLevelBadge = (level) => {
    const colors = {
      primary: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      middle: 'bg-blue-100 text-blue-800 border-blue-200',
      high_school: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    const labels = {
      primary: 'Primary',
      middle: 'Middle School',
      high_school: 'High School'
    };
    return { 
      color: colors[level] || 'bg-gray-100 text-gray-800 border-gray-200', 
      label: labels[level] || level 
    };
  };

  const getEnrollmentStatusBadge = (status) => {
    const badges = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
      paused: { label: 'Paused', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      suspended: { label: 'Suspended', className: 'bg-amber-100 text-amber-800 border-amber-200' },
      withdrawn: { label: 'Withdrawn', className: 'bg-rose-100 text-rose-800 border-rose-200' },
      completed: { label: 'Completed', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      transferred: { label: 'Transferred', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    if (badges[status]) return badges[status];
    const label = typeof status === 'string'
      ? status.replace(/_/g, ' ').replace(/^./, (ch) => ch.toUpperCase())
      : 'Status';
    return { label, className: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const getPaymentStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const calculateBalance = () => {
    try {
      return (enrollments || []).reduce((sum, e) => {
        const b = Number(e?.balance);
        if (Number.isFinite(b)) return sum + b;
        const total = Number(e?.totalSessions ?? e?.sessionsCount ?? 0);
        const completed = Number(e?.sessionsCompleted ?? 0);
        const fallback = total - completed;
        return sum + (Number.isFinite(fallback) ? fallback : 0);
      }, 0);
    } catch {
      return 0;
    }
  };

  const historyActionStyles = {
    enroll: { label: 'Enroll', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    unenroll: { label: 'Unenroll', className: 'bg-rose-50 text-rose-700 border-rose-200' },
    transfer: { label: 'Transfer', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    suspend: { label: 'Suspend', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    unsuspend: { label: 'Unsuspend', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    note: { label: 'Note', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  };

  const getHistoryActionMeta = (action) => {
    const fallbackLabel = typeof action === 'string'
      ? action.replace(/_/g, ' ').replace(/^./, (ch) => ch.toUpperCase())
      : 'Update';
    return historyActionStyles[action] || {
      label: fallbackLabel,
      className: 'bg-slate-50 text-slate-700 border-slate-200',
    };
  };

  const lifecycleStatuses = ['active', 'suspended', 'paused'];
  const lifecycleEnrollments = (enrollments || []).filter((enrollment) => lifecycleStatuses.includes(enrollment.status));
  const activeEnrollmentCount = (enrollments || []).filter((e) => e.status === 'active').length;

  const levelBadge = getEducationLevelBadge(student?.educationLevel);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                {student?.firstName?.[0] || student?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <QrCode className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 font-mono">{student?.studentCode}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBarcodeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <QrCode className="w-4 h-4" />
              Barcode Card
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
            <button
              onClick={() => onEdit?.(student)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {actionError && !actionModal?.type && (
          <div className="px-6 mt-3">
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{actionError}</span>
              <button onClick={() => setActionError('')} className="text-rose-600 hover:text-rose-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: User },
                { id: 'enrollments', name: 'Enrollments', icon: BookOpen },
                { id: 'payments', name: 'Payment History', icon: CreditCard },
                { id: 'history', name: 'Progress', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Core Information */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-500" />
                          Core Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Personal Information */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Personal Details</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.name}
                                  </p>
                                  <p className="text-xs text-gray-500">Full Name</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <QrCode className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 font-mono">{student?.studentCode}</p>
                                  <p className="text-xs text-gray-500">Student Code</p>
                                </div>
                              </div>
                              {student?.dateOfBirth && (
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {new Date(student.dateOfBirth).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">Date of Birth</p>
                                  </div>
                                </div>
                              )}
                              {student?.gender && (
                                <div className="flex items-center gap-3">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 capitalize">{student.gender}</p>
                                    <p className="text-xs text-gray-500">Gender</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contact Information */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Information</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{student?.email}</p>
                                  <p className="text-xs text-gray-500">Email Address</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{student?.phone}</p>
                                  <p className="text-xs text-gray-500">Phone Number</p>
                                </div>
                              </div>
                              {student?.emergencyContact && (
                                <div className="flex items-center gap-3">
                                  <AlertCircle className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.emergencyContact}</p>
                                    <p className="text-xs text-gray-500">Emergency Contact</p>
                                  </div>
                                </div>
                              )}
                              {student?.address && (
                                <div className="flex items-center gap-3">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.address}</p>
                                    <p className="text-xs text-gray-500">Address</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Academic Information */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Academic Details</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${levelBadge.color}`}>
                                    {levelBadge.label}
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">Education Level</p>
                                </div>
                              </div>
                              {student?.currentSchool && (
                                <div className="flex items-center gap-3">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.currentSchool}</p>
                                    <p className="text-xs text-gray-500">Current School</p>
                                  </div>
                                </div>
                              )}
                              {student?.grade && (
                                <div className="flex items-center gap-3">
                                  <Star className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.grade}</p>
                                    <p className="text-xs text-gray-500">Current Grade</p>
                                  </div>
                                </div>
                              )}
                              {student?.subjects && student.subjects.length > 0 && (
                                <div className="flex items-start gap-3">
                                  <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {student.subjects.join(', ')}
                                    </p>
                                    <p className="text-xs text-gray-500">Subjects of Interest</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Additional Information */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Info</h4>
                            <div className="space-y-3">
                              {student?.parentName && (
                                <div className="flex items-center gap-3">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.parentName}</p>
                                    <p className="text-xs text-gray-500">Parent/Guardian</p>
                                  </div>
                                </div>
                              )}
                              {student?.parentPhone && (
                                <div className="flex items-center gap-3">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.parentPhone}</p>
                                    <p className="text-xs text-gray-500">Parent Phone</p>
                                  </div>
                                </div>
                              )}
                              {student?.medicalInfo && (
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.medicalInfo}</p>
                                    <p className="text-xs text-gray-500">Medical Information</p>
                                  </div>
                                </div>
                              )}
                              {student?.notes && (
                                <div className="flex items-start gap-3">
                                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.notes}</p>
                                    <p className="text-xs text-gray-500">Notes</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="space-y-6">
                      {/* Active Enrollments */
                      }
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-purple-900">Active Classes</h3>
                          <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold text-purple-900 mb-2">
                          {activeEnrollmentCount}
                        </div>
                        <p className="text-sm text-purple-700">Currently Enrolled</p>
                      </div>

                      {/* Total Debt */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-emerald-900">Total Debt</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${totalDebt >= 0 ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {totalDebt >= 0 ? 'Credit' : 'Owed'}
                          </span>
                        </div>
                        <div className={`text-3xl font-bold mb-1 ${totalDebt >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                          {formatDZ(Math.abs(totalDebt))}
                        </div>
                        <p className={`text-sm ${totalDebt >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {totalDebt >= 0 ? 'School owes student' : 'Student owes school'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'enrollments' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Class Enrollments</h3>
                        <p className="text-xs text-gray-500">Active, paused, and suspended enrollments</p>
                      </div>
                      <button
                        onClick={() => setShowEnrollModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Enroll
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {lifecycleEnrollments.map((enrollment) => {
                        const classData = typeof enrollment.classId === 'object' ? enrollment.classId : enrollment.classData;
                        const schedules = classData?.schedules || enrollment.schedules || [];
                        const scheduleText = schedules.length ? formatSchedule(schedules) : (enrollment.schedule || 'Schedule unavailable');
                        const className = classData?.name || enrollment.className || 'Class';
                        const isToday = isTodayClass(schedules);
                        const balanceValue = Number(enrollment.balance) || 0;
                        const snap = enrollment.pricingSnapshot || {};
                        const unitLabel = snap.paymentModel === 'per_cycle' ? 'cycles' : 'sessions';
                        const statusMeta = getEnrollmentStatusBadge(enrollment.status);
                        const isSuspended = enrollment.status === 'suspended';
                        const canMarkAttendance = enrollment.status === 'active';
                        const cardClasses = [
                          'border rounded-lg p-4 transition-all duration-200',
                          isToday
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 ring-2 ring-blue-300 shadow-lg'
                            : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300',
                          isSuspended ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' : '',
                        ].join(' ').trim();

                        return (
                          <div key={enrollment._id} className={cardClasses}>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 line-clamp-2">{className}</h4>
                              <div className="flex flex-col items-end gap-1">
                                {statusMeta && (
                                  <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${statusMeta.className}`}>
                                    {statusMeta.label}
                                  </span>
                                )}
                                {isToday && (
                                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium shadow-sm">
                                    Today
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              {scheduleText}
                            </div>

                            {isSuspended && enrollment.suspension?.reason && (
                              <div className="text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                {enrollment.suspension.reason}
                              </div>
                            )}

                            <div className={`rounded p-3 mb-3 ${isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide">Balance</div>
                                  <div className={`font-semibold text-lg ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                                    {balanceValue.toFixed(1)} <span className="text-sm font-normal text-gray-500">{unitLabel}</span>
                                  </div>
                                </div>
                                {balanceValue <= 0 && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 border border-rose-200">Debt</span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 text-xs">
                              <button
                                onClick={() => canMarkAttendance && markAttendance(enrollment._id, 'present')}
                                disabled={!canMarkAttendance}
                                title="Mark Present"
                                className={`flex-1 h-9 px-3 py-2 text-white rounded-lg font-medium transition-colors ${canMarkAttendance ? 'bg-green-600 hover:bg-green-700' : 'bg-green-400 cursor-not-allowed opacity-60'}`}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Present
                                </span>
                              </button>
                              <button
                                onClick={() => canMarkAttendance && markAttendance(enrollment._id, 'absent')}
                                disabled={!canMarkAttendance}
                                title="Mark Absent"
                                className={`flex-1 h-9 px-3 py-2 text-white rounded-lg font-medium transition-colors ${canMarkAttendance ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-300 cursor-not-allowed opacity-60'}`}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <XCircle className="w-4 h-4" />
                                  Absent
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEnrollment(enrollment);
                                  setShowPaymentModal(true);
                                }}
                                title="Record Payment"
                                className={`flex-1 h-9 px-3 py-2 rounded-lg font-medium border transition-colors ${isToday ? 'border-blue-400 text-blue-700 bg-white hover:bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <CreditCard className="w-4 h-4" />
                                  Payment
                                </span>
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <button
                                onClick={() => openActionModal('transfer', enrollment)}
                                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-medium"
                              >
                                <span className="inline-flex items-center gap-1 justify-center">
                                  <ArrowLeftRight className="w-4 h-4" />
                                  Transfer
                                </span>
                              </button>
                              {enrollment.status === 'suspended' ? (
                                <button
                                  onClick={() => handleUnsuspend(enrollment)}
                                  className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium"
                                >
                                  <span className="inline-flex items-center gap-1 justify-center">
                                    <PlayCircle className="w-4 h-4" />
                                    Unsuspend
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openActionModal('suspend', enrollment)}
                                  className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium"
                                >
                                  <span className="inline-flex items-center gap-1 justify-center">
                                    <PauseCircle className="w-4 h-4" />
                                    Suspend
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => openActionModal('unenroll', enrollment)}
                                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-medium"
                              >
                                <span className="inline-flex items-center gap-1 justify-center">
                                  <XCircle className="w-4 h-4" />
                                  Unenroll
                                </span>
                              </button>
                            </div>
                            <div className="mt-3 text-xs text-gray-600">
                              {snap.paymentModel === 'per_session' && typeof snap.sessionPrice === 'number' && (
                                <span>Per session: {formatDZ(snap.sessionPrice)}</span>
                              )}
                              {snap.paymentModel === 'per_cycle' && typeof snap.cyclePrice === 'number' && typeof snap.cycleSize === 'number' && (
                                <span>Cycle: {snap.cycleSize} sessions · {formatDZ(snap.cyclePrice)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {lifecycleEnrollments.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">📚</div>
                          <p>No active, paused, or suspended enrollments</p>
                          <p className="text-sm">Click "Enroll" to add a new enrollment</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kind</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debt Impact</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((p) => (
                              <tr key={p._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 capitalize">{p.kind}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{typeof p.amount === 'number' ? formatDZ(p.amount) : ''}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 capitalize">{p.method}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <span>{p.note || ''}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {typeof p.debtDelta === 'number' && p.debtDelta !== 0 ? (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${p.debtDelta > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                      <span>{p.debtDelta > 0 ? 'Credit' : 'Owed'}</span>
                                      <span>{p.debtDelta > 0 ? `+${formatDZ(p.debtDelta)}` : `-${formatDZ(Math.abs(p.debtDelta))}`}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <button
                                    onClick={() => openPrintableReceipt(p)}
                                    disabled={!p?.receiptMeta?.printable}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium ${p?.receiptMeta?.printable ? 'border-indigo-200 text-indigo-700 hover:bg-indigo-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                                  >
                                    <FileText className="w-4 h-4" />
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Progress Timeline</h3>
                      <span className="text-sm text-gray-500">{history.length} events</span>
                    </div>

                    {historyLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : history.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <div className="text-4xl mb-2">🗒️</div>
                        <p>No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {history.map((event) => {
                          const actionMeta = getHistoryActionMeta(event.action);
                          return (
                            <div key={event.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${actionMeta.className}`}>
                                      {actionMeta.label}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {event.class?.name || 'Class not specified'}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : ''}
                                  </div>
                                </div>

                                <div className="text-sm text-gray-700">
                                  <p className="text-gray-900 font-semibold">{event.summary}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    By {event.actorName || 'System'}
                                    {event.actorRole ? ` · ${event.actorRole}` : ''}
                                  </p>
                                </div>

                                {event.reason && (
                                  <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                    <span className="text-gray-500 text-xs uppercase tracking-wide">Reason</span>
                                    <p className="text-gray-900 mt-1">{event.reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
  </div>

  {/* New Enrollment Modal */}
    {showEnrollModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl">
          <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">New Enrollment</h3>
            <button
              onClick={() => { setShowEnrollModal(false); setSelectedClassId(''); setEnrollError(''); }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Enroll {student?.firstName} {student?.lastName} into a class. Availability and pricing are shown below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  value={classQuery}
                  onChange={(e) => setClassQuery(e.target.value)}
                  placeholder="Search by class name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={classType}
                  onChange={(e) => setClassType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">All</option>
                  <option value="supportLessons">Support Lessons</option>
                  <option value="reviewCourses">Review Courses</option>
                  <option value="vocationalTrainings">Vocational Trainings</option>
                  <option value="languages">Languages</option>
                  <option value="otherActivities">Other Activities</option>
                </select>
              </div>
            </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Choose a class...</option>
                {availableClasses
                  .filter(c => (classType === 'all' ? true : c.catalogItem?.type === classType))
                  .filter(c => (classQuery ? c.name?.toLowerCase().includes(classQuery.toLowerCase()) : true))
                  .map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {enrollError && (
                <p className="mt-2 text-sm text-red-600">{enrollError}</p>
              )}
            </div>

            {!!selectedClassId && (
              (() => {
                const c = availableClasses.find(x => x._id === selectedClassId);
                if (!c) return null;
                const priceInfo = c.paymentModel === 'per_cycle'
                  ? `Price per cycle: ${formatDZ(c.cyclePrice)} (Cycle size: ${c.cycleSize} sessions)`
                  : c.paymentModel === 'per_session'
                    ? `Price per session: ${formatDZ(c.sessionPrice)}`
                    : '';
                const scheduleText = Array.isArray(c.schedules)
                  ? c.schedules.map(s => `${s.dayOfWeek?.[0]?.toUpperCase()}${s.dayOfWeek?.slice(1)} ${s.startTime}-${s.endTime}`).join(', ')
                  : '';
                return (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
                    <div>Teacher: {c.teacherId?.firstName} {c.teacherId?.lastName}</div>
                    <div>Room: {c.roomId?.name}</div>
                    <div>Schedule: {scheduleText}</div>
                    <div className="font-medium">{priceInfo}</div>
                    {typeof c.remainingSpots === 'number' && (
                      <div>Remaining spots: {c.remainingSpots}</div>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { setShowEnrollModal(false); setSelectedClassId(''); setEnrollError(''); }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              disabled={!selectedClassId || isEnrollLoading}
              onClick={async () => {
                if (!selectedClassId) return;
                setIsEnrollLoading(true);
                setEnrollError('');
                try {
                  const token = getAuthToken();
                  const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
                  await axios.post(`/api/students/${student._id}/enroll`, { classId: selectedClassId }, config);
                  // Refresh enrollments and close
                  await fetchStudentData();
                  setShowEnrollModal(false);
                  setSelectedClassId('');
                } catch (err) {
                  setEnrollError(err.response?.data?.message || 'Failed to enroll student');
                } finally {
                  setIsEnrollLoading(false);
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnrollLoading ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </div>
      </div>
    )}

  {/* Lifecycle Action Modal */}
  {actionModal?.type && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <form onSubmit={submitAction} className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{actionTitles[actionModal.type]}</h3>
            <p className="text-sm text-gray-500">{actionModal?.enrollment?.className}</p>
          </div>
          <button type="button" onClick={closeActionModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {actionModal.type === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Class</label>
              <select
                value={actionForm.targetClassId}
                onChange={(e) => setActionForm((prev) => ({ ...prev, targetClassId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select class...</option>
                {transferClasses
                  .filter((c) => c._id !== (actionModal?.enrollment?.classId || actionModal?.enrollment?.class_id))
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} · {c.paymentModel === 'per_session'
                        ? `${typeof c.sessionPrice === 'number' ? formatDZ(c.sessionPrice) : 'N/A'} / session`
                        : `${typeof c.cyclePrice === 'number' ? formatDZ(c.cyclePrice) : 'N/A'} per ${c.cycleSize || '?'} sessions`}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {(actionModal.type === 'suspend' || actionModal.type === 'unenroll' || actionModal.type === 'transfer') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason / Notes</label>
              <textarea
                value={actionForm.reason}
                onChange={(e) => setActionForm((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder={actionModal.type === 'suspend' ? 'Required' : 'Optional'}
              />
            </div>
          )}

          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={closeActionModal}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionSubmitting}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {actionSubmitting ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  )}

  {/* Record Payment Modal */}
  {showPaymentModal && (
    <PaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      enrollmentId={selectedEnrollment?._id || ''}
      pricingSnapshot={selectedEnrollment?.pricingSnapshot}
      defaultKind={ (selectedEnrollment?.balance ?? 0) <= 0 ? 'pay_cycles' : 'pay_sessions' }
      onSuccess={async () => { await fetchStudentData(); }}
    />
  )}

  {/* Barcode Card Modal */}
  {showBarcodeModal && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Barcode Card</h3>
          <button onClick={() => setShowBarcodeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center">
          {/* Print-ready card area */}
          <div className="border border-gray-300 rounded-lg p-4 bg-white" style={{ width: '8.5cm' }}>
            <div className="text-center mb-3">
              <div className="text-sm text-gray-500">Student ID Card</div>
              <div className="text-base font-semibold text-gray-900">
                {`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.name}
              </div>
              <div className="text-xs text-gray-500 font-mono">Code: {student?.studentCode}</div>
            </div>
            <div className="mt-2">
              <Barcode
                value={String(student?.studentCode || '')}
                format="CODE128"
                width={1.6}
                height={60}
                displayValue
                fontSize={12}
                margin={0}
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Print</button>
            <button onClick={() => setShowBarcodeModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">Close</button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* QR Code Card Modal */}
  {showQrModal && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student QR Code Card</h3>
          <button onClick={() => setShowQrModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center">
          {/* Print-ready card area */}
          <div className="border border-gray-300 rounded-lg p-4 bg-white" style={{ width: '8.5cm' }}>
            <div className="text-center mb-3">
              <div className="text-sm text-gray-500">Student ID Card</div>
              <div className="text-base font-semibold text-gray-900">
                {`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.name}
              </div>
              <div className="text-xs text-gray-500 font-mono">Code: {student?.studentCode}</div>
            </div>
            <div className="flex items-center justify-center mt-2">
              <QRCode value={String(student?.studentCode || '')} size={128} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Print</button>
            <button onClick={() => setShowQrModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">Close</button>
          </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default StudentProfilePopup;
