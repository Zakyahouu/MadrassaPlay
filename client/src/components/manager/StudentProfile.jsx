import React, { useState, useEffect } from 'react';
import formatDZ from '../../utils/currency';
import { 
  User, Mail, Phone, MapPin, GraduationCap, QrCode, BookOpen, 
  CreditCard, Calendar, Clock, Star,
  Plus, Edit, Download, ArrowLeft, Building2, CheckCircle,
  AlertCircle, Clock as ClockIcon
} from 'lucide-react';
import axios from 'axios';

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

const StudentProfile = ({ student, onBack, onRefresh }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (student?._id) {
      fetchStudentData();
    }
  }, [student?._id]);

  const fetchStudentData = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // Fetch enrollments and payments for this student (unified payments endpoint)
      const [enrollmentsRes, paymentsRes] = await Promise.all([
        axios.get(`/api/students/${student._id}/enrollments`, config),
        axios.get('/api/payments', { ...config, params: { studentId: student._id, limit: 200 } })
      ]);

      setEnrollments(enrollmentsRes.data || []);
      setPayments(Array.isArray(paymentsRes.data?.items) ? paymentsRes.data.items : []);
    } catch (error) {
      console.error('Error fetching student data:', error);
      // Use mock data for demo
      setEnrollments([
        {
          _id: '1',
          className: 'Math Support - Grade 5',
          teacher: 'Ahmed Benali',
          startDate: '2024-01-15',
          sessionsCount: 10,
          sessionsCompleted: 7,
          totalAmount: 2000,
          amountPaid: 2000,
          status: 'active',
          schedule: 'Monday, Wednesday 2:00 PM'
        }
      ]);
      setPayments([
        {
          _id: '1',
          amount: 2000,
          method: 'cash',
          date: '2024-01-15',
          description: 'Payment for Math Support - Grade 5',
          status: 'completed'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
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
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
    let totalCredit = 0;
    let totalUsed = 0;
    
    enrollments.forEach(enrollment => {
      totalCredit += enrollment.sessionsCount;
      totalUsed += enrollment.sessionsCompleted || 0;
    });
    
    return totalCredit - totalUsed;
  };



  const levelBadge = getEducationLevelBadge(student.educationLevel);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                  {student.firstName?.[0] || student.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {`${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <QrCode className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-mono">{student.studentCode}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: User },
                { id: 'enrollments', name: 'Enrollments', icon: BookOpen },
                { id: 'payments', name: 'Payment History', icon: CreditCard }
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
          <div className="p-6">
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
                                 {`${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name}
                               </p>
                               <p className="text-xs text-gray-500">Full Name</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <QrCode className="w-4 h-4 text-gray-400" />
                             <div>
                               <p className="text-sm font-medium text-gray-900 font-mono">{student.studentCode}</p>
                               <p className="text-xs text-gray-500">Student Code</p>
                             </div>
                           </div>
                           {student.dateOfBirth && (
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
                           {student.gender && (
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
                               <p className="text-sm font-medium text-gray-900">{student.email}</p>
                               <p className="text-xs text-gray-500">Email Address</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <Phone className="w-4 h-4 text-gray-400" />
                             <div>
                               <p className="text-sm font-medium text-gray-900">{student.phone}</p>
                               <p className="text-xs text-gray-500">Phone Number</p>
                             </div>
                           </div>
                           {student.emergencyContact && (
                             <div className="flex items-center gap-3">
                               <AlertCircle className="w-4 h-4 text-gray-400" />
                               <div>
                                 <p className="text-sm font-medium text-gray-900">{student.emergencyContact}</p>
                                 <p className="text-xs text-gray-500">Emergency Contact</p>
                               </div>
                             </div>
                           )}
                           {student.address && (
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
                           {student.currentSchool && (
                             <div className="flex items-center gap-3">
                               <Building2 className="w-4 h-4 text-gray-400" />
                               <div>
                                 <p className="text-sm font-medium text-gray-900">{student.currentSchool}</p>
                                 <p className="text-xs text-gray-500">Current School</p>
                               </div>
                             </div>
                           )}
                           {student.grade && (
                             <div className="flex items-center gap-3">
                               <Star className="w-4 h-4 text-gray-400" />
                               <div>
                                 <p className="text-sm font-medium text-gray-900">{student.grade}</p>
                                 <p className="text-xs text-gray-500">Current Grade</p>
                               </div>
                             </div>
                           )}
                           {student.subjects && student.subjects.length > 0 && (
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
                           {student.parentName && (
                             <div className="flex items-center gap-3">
                               <User className="w-4 h-4 text-gray-400" />
                               <div>
                                 <p className="text-sm font-medium text-gray-900">{student.parentName}</p>
                                 <p className="text-xs text-gray-500">Parent/Guardian</p>
                               </div>
                             </div>
                           )}
                           {student.parentPhone && (
                             <div className="flex items-center gap-3">
                               <Phone className="w-4 h-4 text-gray-400" />
                               <div>
                                 <p className="text-sm font-medium text-gray-900">{student.parentPhone}</p>
                                 <p className="text-xs text-gray-500">Parent Phone</p>
                               </div>
                             </div>
                           )}
                           {student.medicalInfo && (
                             <div className="flex items-start gap-3">
                               <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                               <div>
                                 <p className="text-sm font-medium text-gray-900">{student.medicalInfo}</p>
                                 <p className="text-xs text-gray-500">Medical Information</p>
                               </div>
                             </div>
                           )}
                           {student.notes && (
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
                  {/* Balance Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-green-900">Session Balance</h3>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-2">
                      {calculateBalance()}
                    </div>
                    <p className="text-sm text-green-700">Available Sessions</p>
                  </div>



                  {/* Active Enrollments */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-purple-900">Active Classes</h3>
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-purple-900 mb-2">
                      {enrollments.filter(e => e.status === 'active').length}
                    </div>
                    <p className="text-sm text-purple-700">Currently Enrolled</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'enrollments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Enrollment History</h3>
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    New Enrollment
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Class
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Teacher
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {enrollments.map((enrollment) => (
                          <tr key={enrollment._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{enrollment.className}</div>
                                <div className="text-sm text-gray-500">{enrollment.schedule}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{enrollment.teacher}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${(enrollment.sessionsCompleted / enrollment.sessionsCount) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {enrollment.sessionsCompleted}/{enrollment.sessionsCount}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {enrollment.totalAmount.toLocaleString()} DZD
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getEnrollmentStatusBadge(enrollment.status)}`}>
                                {enrollment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <CreditCard className="w-4 h-4" />
                    Record Payment
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {new Date(payment.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{payment.description}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {payment.amount.toLocaleString()} DZD
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 capitalize">{payment.method}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getPaymentStatusBadge(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
