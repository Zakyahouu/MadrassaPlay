import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, DollarSign, Calendar, User, BookOpen, AlertTriangle, CheckCircle, RefreshCw, FileText } from 'lucide-react';

const StudentPaymentDetailModal = ({ transactionId, onClose, formatCurrency, formatDate }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const response = await axios.get(`/api/payments/${transactionId}`, config);
        if (response.data) {
          setTransaction(response.data);
        } else {
          setError('Transaction not found.');
        }
      } catch (err) {
        console.error('Error fetching transaction details:', err);
        setError(err.response?.data?.message || 'Failed to fetch transaction details.');
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchTransactionDetails();
    }
  }, [transactionId]);

  const getDebtStatus = (debtDelta) => {
    if (debtDelta > 0) {
      return { text: 'Owed', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (debtDelta < 0) {
      return { text: 'Credit', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else {
      return { text: 'Paid', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const getPaymentKindIcon = (kind) => {
    switch (kind) {
      case 'pay_sessions':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'pay_cycles':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-700">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex justify-end">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center text-red-600">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  const debtStatus = getDebtStatus(transaction.debtDelta);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-xl w-full">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Payment Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <DetailRow label="Date" value={formatDate(transaction.createdAt)} icon={<Calendar className="w-5 h-5 text-gray-500" />} />
          <DetailRow
            label="Student"
            value={`${transaction.studentId?.firstName || ''} ${transaction.studentId?.lastName || ''} (${transaction.studentId?.studentCode || 'N/A'})`}
            icon={<User className="w-5 h-5 text-gray-500" />}
          />
          <DetailRow label="Class" value={transaction.classId?.name || 'N/A'} icon={<BookOpen className="w-5 h-5 text-gray-500" />} />
          <DetailRow label="Amount Paid" value={formatCurrency(transaction.taken)} icon={<DollarSign className="w-5 h-5 text-green-500" />} />
          {transaction.expectedPrice && transaction.expectedPrice !== transaction.amount && (
            <DetailRow label="Expected Price" value={formatCurrency(transaction.expectedPrice)} icon={<DollarSign className="w-5 h-5 text-gray-500" />} />
          )}
          <DetailRow
            label="Payment Type"
            value={
              <span className="flex items-center">
                {getPaymentKindIcon(transaction.kind)}
                <span className="ml-2">{transaction.kind.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </span>
            }
            icon={<FileText className="w-5 h-5 text-gray-500" />}
          />
          <DetailRow
            label="Debt Status"
            value={
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${debtStatus.bgColor} ${debtStatus.color}`}>
                {debtStatus.text === 'Owed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {debtStatus.text === 'Credit' && <CheckCircle className="w-3 h-3 mr-1" />}
                {debtStatus.text === 'Paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                {debtStatus.text}
                {transaction.debtDelta !== 0 && (
                  <span className="ml-1">({transaction.debtDelta > 0 ? '+' : ''}{formatCurrency(transaction.debtDelta)})</span>
                )}
              </span>
            }
            icon={<AlertTriangle className="w-5 h-5 text-gray-500" />}
          />
          {transaction.note && (
            <DetailRow label="Note" value={transaction.note} icon={<FileText className="w-5 h-5 text-gray-500" />} />
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, icon }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 mr-3 mt-1">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  </div>
);

export default StudentPaymentDetailModal;




