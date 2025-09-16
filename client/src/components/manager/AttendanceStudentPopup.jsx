import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { QrCode, X, Calendar, Clock, CreditCard, CheckCircle, XCircle, DollarSign, User, Users, BookOpen, TrendingUp } from 'lucide-react';
import formatDZ from '../../utils/currency';
import PaymentModal from '../shared/PaymentModal';

const AttendanceStudentPopup = ({ isOpen, onClose, student, initialEnrollments }) => {
  const [enrollments, setEnrollments] = useState(Array.isArray(initialEnrollments) ? initialEnrollments : []);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(initialEnrollments?.[0]?._id || null);
  const [payments, setPayments] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [marking, setMarking] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' or 'attendance'
  const [studentDebt, setStudentDebt] = useState(0);
  const [loadingDebt, setLoadingDebt] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNote, setDebtNote] = useState('');
  const [payingDebt, setPayingDebt] = useState(false);

  useEffect(() => {
    console.log('AttendanceStudentPopup - initialEnrollments:', initialEnrollments);
    console.log('AttendanceStudentPopup - student:', student);
    setEnrollments(Array.isArray(initialEnrollments) ? initialEnrollments : []);
    setSelectedEnrollmentId(initialEnrollments?.[0]?._id || null);
  }, [initialEnrollments, student]);

  useEffect(() => {
    if (!isOpen) return;
    // Load payments and attendance history for selected enrollment
    const loadData = async () => {
      if (!selectedEnrollmentId) { 
        setPayments([]); 
        setAttendanceHistory([]);
        return; 
      }
      try {
        setLoadingPayments(true);
        setLoadingAttendance(true);
        
        // Load payments
        const paymentsRes = await axios.get('/api/payments', { params: { enrollmentId: selectedEnrollmentId, limit: 100 } });
        console.log('Payments response:', paymentsRes.data);
        setPayments(Array.isArray(paymentsRes.data?.items) ? paymentsRes.data.items : []);
        
        // Load attendance history
        const attendanceRes = await axios.get('/api/attendance/history', { params: { enrollmentId: selectedEnrollmentId } });
        console.log('Attendance response:', attendanceRes.data);
        setAttendanceHistory(Array.isArray(attendanceRes.data?.items) ? attendanceRes.data.items : []);
      } catch (e) {
        setPayments([]);
        setAttendanceHistory([]);
        console.error('Error loading data:', e);
      } finally {
        setLoadingPayments(false);
        setLoadingAttendance(false);
      }
    };
    loadData();
  }, [isOpen, selectedEnrollmentId]);

  // Load student debt when modal opens
  useEffect(() => {
    if (isOpen && student?._id) {
      loadStudentDebt();
    }
  }, [isOpen, student?._id]);

  const selectedEnrollment = useMemo(() => {
    const found = enrollments.find(e => (e._id||'').toString() === (selectedEnrollmentId||'').toString()) || null;
    console.log('Selected enrollment:', found);
    console.log('Available enrollments:', enrollments);
    console.log('Selected enrollment ID:', selectedEnrollmentId);
    return found;
  }, [enrollments, selectedEnrollmentId]);

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

  const markAttendance = async (enrollmentId, status) => {
    try {
      setMarking(true);
      const date = new Date().toISOString().slice(0,10);
      await axios.post('/api/attendance/mark', { enrollmentId, date, status });
      // Refresh enrollments (balance may change)
      // Caller should ideally pass fresh enrollments, but we can soft-update by refetching student enrollments
      if (student?._id) {
        const { data } = await axios.get(`/api/enrollments/student/${student._id}`);
        setEnrollments(Array.isArray(data) ? data.filter(e => e.status==='active') : []);
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  const undoAttendance = async (enrollmentId) => {
    try {
      setMarking(true);
      const date = new Date().toISOString().slice(0,10);
      await axios.post('/api/attendance/undo', { enrollmentId, date });
      // Refresh enrollments
      if (student?._id) {
        const { data } = await axios.get(`/api/enrollments/student/${student._id}`);
        setEnrollments(Array.isArray(data) ? data.filter(e => e.status==='active') : []);
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to undo attendance');
    } finally {
      setMarking(false);
    }
  };

  const openHistory = async (enrollmentId) => {
    try {
      const { data } = await axios.get('/api/attendance/history', { params: { enrollmentId } });
      // You can implement a history modal here or show the data in a different way
      console.log('Attendance history:', data);
      alert(`Attendance history loaded for enrollment ${enrollmentId}. Check console for details.`);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to load attendance history');
    }
  };

  const loadStudentDebt = async () => {
    if (!student?._id) return;
    try {
      setLoadingDebt(true);
      const { data } = await axios.get(`/api/payments/student-debt/${student._id}`);
      setStudentDebt(data.data?.debt || 0);
    } catch (e) {
      console.error('Error loading student debt:', e);
      setStudentDebt(0);
    } finally {
      setLoadingDebt(false);
    }
  };

  const payDebt = async () => {
    if (!student?._id || !debtAmount || parseFloat(debtAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const paymentAmount = parseFloat(debtAmount);
    if (paymentAmount > Math.abs(studentDebt)) {
      alert(`Payment amount cannot exceed current debt of ${formatDZ(Math.abs(studentDebt))}`);
      return;
    }

    try {
      setPayingDebt(true);
      
      // Calculate the adjustment amount
      // User enters amount they want to pay down from current debt
      const paymentAmount = parseFloat(debtAmount);
      const adjustmentAmount = -paymentAmount; // Always negative to reduce debt

      const { data } = await axios.post('/api/payments/adjust-debt', {
        studentId: student._id,
        debtAdjustment: adjustmentAmount,
        reason: studentDebt > 0 ? 'Debt payment' : 'Credit adjustment',
        note: debtNote || (studentDebt > 0 ? `Debt payment: ${debtAmount} DZD` : `Credit adjustment: ${debtAmount} DZD`)
      });

      const newDebt = studentDebt + adjustmentAmount;
      alert(`Debt payment successful! Paid ${paymentAmount} DZD. New balance: ${newDebt > 0 ? `Student owes: ${formatDZ(newDebt)}` : newDebt < 0 ? `School owes: ${formatDZ(Math.abs(newDebt))}` : 'No balance'}`);
      
      // Reset form and close modal
      setDebtAmount('');
      setDebtNote('');
      setShowDebtModal(false);
      
      // Reload debt and payments
      await loadStudentDebt();
      if (selectedEnrollmentId) {
        const paymentsRes = await axios.get('/api/payments', { params: { enrollmentId: selectedEnrollmentId, limit: 100 } });
        setPayments(Array.isArray(paymentsRes.data?.items) ? paymentsRes.data.items : []);
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to adjust debt');
    } finally {
      setPayingDebt(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-lg border border-gray-200">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-2xl border border-white/30 shadow-lg">
                {student?.firstName?.[0] || student?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.name}
                </h1>
                <div className="flex items-center gap-3 text-blue-100">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    <span className="font-mono text-lg font-semibold">{student?.studentCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span>Student Profile</span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-180px)] space-y-8">
          {/* Enrollment Cards */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Active Enrollments</h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                {enrollments.filter(e=>e.status==='active').length} active
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4">
                {(enrollments.filter(e=>e.status==='active').length > 0 ? enrollments.filter(e=>e.status==='active') : enrollments).map((e)=>{
                  const schedules = e.classId?.schedules || [];
                  const scheduleText = formatSchedule(schedules);
                  const balance = typeof e.balance === 'number' ? e.balance : 0;
                  const balanceClass = balance > 0 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : balance <= 0 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-gray-50 text-gray-700 border-gray-200';
                  const today = isTodayClass(schedules);
                  const snap = e.pricingSnapshot || {};
                  const isSelected = (e._id||'').toString() === (selectedEnrollmentId||'').toString();
                  
                  return (
                    <div 
                      key={e._id} 
                      className={`min-w-[360px] border-2 rounded-2xl p-6 bg-white transition-all duration-200 cursor-pointer hover:shadow-lg ${
                        isSelected 
                          ? 'ring-4 ring-blue-200 border-blue-300 shadow-md' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedEnrollmentId(e._id)}
                    >
                      {/* Class Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{e.classId?.name || 'Class'}</h4>
                            {today && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Live Today</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {today && (
                          <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border-2 border-green-200">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Today
                          </div>
                        )}
                      </div>

                      {/* Schedule Info */}
                      <div className="flex items-center gap-2 mb-4 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{scheduleText || 'No schedule'}</span>
                      </div>

                      {/* Balance & Pricing */}
                      <div className="space-y-3 mb-4">
                        <div className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl border-2 ${balanceClass}`}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Balance: {balance.toFixed(2)}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {snap.paymentModel === 'per_session' && typeof snap.sessionPrice === 'number' && (
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">Per session: {formatDZ(snap.sessionPrice)}</span>
                            </div>
                          )}
                          {snap.paymentModel === 'per_cycle' && typeof snap.cyclePrice === 'number' && typeof snap.cycleSize === 'number' && (
                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg">
                              <TrendingUp className="w-4 h-4 text-indigo-600" />
                              <span className="font-medium">Cycle: {snap.cycleSize} sessions · {formatDZ(snap.cyclePrice)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button 
                          disabled={marking} 
                          onClick={(e) => { e.stopPropagation(); markAttendance(e._id, 'present'); }} 
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                            marking 
                              ? 'opacity-50 cursor-not-allowed bg-green-600 text-white' 
                              : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Present
                        </button>
                        <button 
                          disabled={marking} 
                          onClick={(e) => { e.stopPropagation(); markAttendance(e._id, 'absent'); }} 
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                            marking 
                              ? 'opacity-50 cursor-not-allowed bg-red-600 text-white' 
                              : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          Absent
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedEnrollmentId(e._id); setShowPaymentModal(true); }} 
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <CreditCard className="w-4 h-4" />
                          Payment
                        </button>
                        
                        {/* Additional Actions */}
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                          <button 
                            disabled={marking} 
                            onClick={(e) => { e.stopPropagation(); undoAttendance(e._id); }} 
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 transition-all duration-200 ${
                              marking 
                                ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Undo
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openHistory(e._id); }} 
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            History
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {enrollments.filter(e=>e.status==='active').length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-8 w-full">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Enrollments</h3>
                    <p className="text-gray-500 text-center">This student is not currently enrolled in any active classes.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment and Attendance History - Tabbed Interface */}
          <div>
            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      activeTab === 'payments'
                        ? 'bg-white text-green-600 shadow-sm border border-green-200'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Payment History
                  </button>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      activeTab === 'attendance'
                        ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Attendance History
                  </button>
                </div>
                {selectedEnrollment && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    activeTab === 'payments' 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {selectedEnrollment.classId?.name || 'Selected Class'}
                  </span>
                )}
              </div>

              {/* Pay Debt Button - Only show on payments tab */}
              {activeTab === 'payments' && (
                <div className="flex items-center gap-3">
                  {loadingDebt ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span className="text-sm">Loading debt...</span>
                    </div>
                  ) : studentDebt !== 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {studentDebt > 0 ? 'Student Owes School' : 'School Owes Student'}
                        </div>
                        <div className={`text-lg font-bold ${studentDebt > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {formatDZ(Math.abs(studentDebt))}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDebtModal(true)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                          studentDebt > 0 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        {studentDebt > 0 ? 'Pay Debt' : 'Adjust Credit'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">No Outstanding Debt</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Payment History Tab */}
              {activeTab === 'payments' && (
                <>
                  {loadingPayments ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                        <span className="text-gray-600 font-medium">Loading payments...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Method</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Units</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Debt Δ</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Note</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((p, index) => (
                            <tr key={p._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : '—'}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                  {p.kind || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-green-600">
                                {typeof p.amount === 'number' ? formatDZ(p.amount) : '—'}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                                  {p.method || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {typeof p.units === 'number' ? p.units : '—'} {p.unitType ? (p.unitType + (p.units === 1 ? '' : 's')) : ''}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium">
                                {typeof p.debtDelta === 'number' ? (
                                  <span className={`${p.debtDelta > 0 ? 'text-red-600' : p.debtDelta < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                    {p.debtDelta > 0 ? '+' : ''}{p.debtDelta}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                {p.note || '—'}
                              </td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <CreditCard className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payments Yet</h3>
                                  <p className="text-gray-500">No payment records found for this enrollment.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Attendance History Tab */}
              {activeTab === 'attendance' && (
                <>
                  {loadingAttendance ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-gray-600 font-medium">Loading attendance...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Marked By</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Note</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendanceHistory.map((record, index) => (
                            <tr key={record._id || index} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {record.date ? new Date(record.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : '—'}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  record.status === 'present' 
                                    ? 'bg-green-100 text-green-800' 
                                    : record.status === 'absent'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {record.status === 'present' ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : record.status === 'absent' ? (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  ) : null}
                                  {record.status || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {record.markedBy ? 
                                  `${record.markedBy.firstName || ''} ${record.markedBy.lastName || ''}`.trim() || 'Unknown' : 
                                  '—'
                                }
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                {record.note || '—'}
                              </td>
                            </tr>
                          ))}
                          {attendanceHistory.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Calendar className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Attendance Records</h3>
                                  <p className="text-gray-500">No attendance records found for this enrollment.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            enrollmentId={selectedEnrollmentId || ''}
            pricingSnapshot={selectedEnrollment?.pricingSnapshot}
            defaultKind={(selectedEnrollment?.balance ?? 0) <= 0 ? 'pay_cycles' : 'pay_sessions'}
            onSuccess={async () => {
              // Refresh enrollments and payments
              if (student?._id) {
                const { data } = await axios.get(`/api/enrollments/student/${student._id}`);
                const list = Array.isArray(data) ? data.filter(e => e.status==='active') : [];
                setEnrollments(list);
                // keep selection
                const sel = list.find(e => (e._id||'').toString() === (selectedEnrollmentId||'').toString());
                const effSel = sel ? sel._id : list[0]?._id;
                setSelectedEnrollmentId(effSel || null);
              }
            }}
          />
        )}

        {/* Debt Payment Modal */}
        {showDebtModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    {studentDebt > 0 ? 'Pay Student Debt' : 'Adjust Student Credit'}
                  </h3>
                  <button
                    onClick={() => setShowDebtModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.name}
                      </div>
                      <div className="text-sm text-gray-600">{student?.studentCode}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Balance
                    </label>
                    <div className={`p-3 border rounded-lg ${
                      studentDebt > 0 
                        ? 'bg-red-50 border-red-200' 
                        : studentDebt < 0 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-lg font-bold ${
                        studentDebt > 0 
                          ? 'text-red-600' 
                          : studentDebt < 0 
                            ? 'text-blue-600' 
                            : 'text-gray-600'
                      }`}>
                        {studentDebt > 0 
                          ? `Student owes: ${formatDZ(studentDebt)}` 
                          : studentDebt < 0 
                            ? `School owes: ${formatDZ(Math.abs(studentDebt))}` 
                            : 'No balance'
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {studentDebt > 0 ? 'Payment Amount *' : 'Adjustment Amount *'}
                    </label>
                    <input
                      type="number"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder={studentDebt > 0 ? "Enter amount to pay" : "Enter amount to adjust"}
                      min="0.01"
                      max={Math.abs(studentDebt)}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {studentDebt > 0 
                        ? `Maximum: ${formatDZ(studentDebt)}` 
                        : `Maximum: ${formatDZ(Math.abs(studentDebt))}`
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (Optional)
                    </label>
                    <textarea
                      value={debtNote}
                      onChange={(e) => setDebtNote(e.target.value)}
                      placeholder="Add a note for this payment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setShowDebtModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={payDebt}
                    disabled={payingDebt || !debtAmount || parseFloat(debtAmount) <= 0}
                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {payingDebt ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4" />
                        {studentDebt > 0 ? 'Pay Debt' : 'Adjust Credit'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceStudentPopup;