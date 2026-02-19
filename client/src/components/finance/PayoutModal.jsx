import React, { useState } from 'react';
import axios from 'axios';

import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  Users,
  Calculator
} from 'lucide-react';

const PayoutModal = ({ teacher, onClose, onSuccess, schoolId, year, month }) => {
  const { t } = useLanguage();
  const [selectedClass, setSelectedClass] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Format currency
  const formatCurrency = (amount) => {
    const { t } = useLanguage();
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get max amount for selected class
  const getMaxAmount = () => {
    const { t } = useLanguage();
    if (!selectedClass) return 0;
    const classData = teacher.classes.find(c => c.classId === selectedClass);
    return classData ? classData.remainingDebt : 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass) {
      setError(t.selectClass);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError(t.amountGreaterThanZero);
      return;
    }

    const maxAmount = getMaxAmount();
    if (parseFloat(amount) > maxAmount) {
      setError(t.amountExceedsDebt.replace('{amount}', formatCurrency(maxAmount)));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        setError(t.authenticationRequired);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post(
        `/api/finance/teachers/pay/${teacher.teacherId}`,
        {
          amount: parseFloat(amount),
          classId: selectedClass,
          method,
          note: note.trim()
        },
        config
      );

      if (response.data.success) {
        onSuccess();
      } else {
        setError(response.data.message || t.failedToRecordPayout);
      }

    } catch (err) {
      console.error('Error recording payout:', err);
      setError(err.response?.data?.message || t.failedToRecordPayout);
    } finally {
      setLoading(false);
    }
  };

  // Handle amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setAmount(value);
      setError('');
    }
  };

  // Set max amount
  const setMaxAmount = () => {
    setAmount(getMaxAmount().toString());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{t.recordTeacherPayout}</h3>
                    <p className="text-sm text-gray-500">{teacher.teacherName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Class Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.selectClass}
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">{t.chooseClass}</option>
                  {teacher.classes.map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.className} - {formatCurrency(cls.remainingDebt)} {t.remaining}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.payoutAmount}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    min="0"
                    max={getMaxAmount()}
                    step="0.01"
                    className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={setMaxAmount}
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      {t.max}
                    </button>
                  </div>
                </div>
                {selectedClass && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t.max}: {formatCurrency(getMaxAmount())}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.paymentMethod}
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="cash">{t.cash}</option>
                  <option value="bank_transfer">{t.bankTransfer}</option>
                  <option value="check">{t.check}</option>
                </select>
              </div>

              {/* Note */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.noteOptional}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t.addNotePayout}
                />
              </div>

              {/* Class Summary */}
              {selectedClass && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{t.classSummary}</h4>
                  {(() => {
                    const classData = teacher.classes.find(c => c.classId === selectedClass);
                    return classData ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">{t.class}:</span>
                          <span className="ml-2 font-medium">{classData.className}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t.studentsPaid}:</span>
                          <span className="ml-2 font-medium">{classData.studentsPaid}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t.calculatedIncome}:</span>
                          <span className="ml-2 font-medium">{formatCurrency(classData.calculatedIncome)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t.paidAmount}:</span>
                          <span className="ml-2 font-medium">{formatCurrency(classData.paidAmount)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">{t.remainingDebt}:</span>
                          <span className="ml-2 font-medium text-red-600">{formatCurrency(classData.remainingDebt)}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading || !selectedClass || !amount}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    {t.recording}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t.recordPayout}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >{t.cancel}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayoutModal;
