import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, DollarSign, Calendar, CreditCard, FileText, AlertCircle } from 'lucide-react';

const PaySalaryModal = ({ employee, year, month, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    paidAmount: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const [calculatedSalary, setCalculatedSalary] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Payment methods
  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'mobile_payment', label: 'Mobile Payment' },
    { value: 'other', label: 'Other' }
  ];

  // Initialize form data
  useEffect(() => {
    if (employee) {
      // Calculate salary based on employee type
      const salary = employee.salaryType === 'fixed' ? employee.salaryValue : 0;
      setCalculatedSalary(salary);
      setFormData(prev => ({
        ...prev,
        paidAmount: salary.toString()
      }));
    }
  }, [employee]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        setError('Authentication required');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = {
        year: parseInt(year),
        month: parseInt(month),
        paidAmount: parseFloat(formData.paidAmount),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      };

      const response = await axios.post(`/api/employees/${employee._id}/pay`, payload, config);

      if (response.data.success) {
        onSuccess();
      } else {
        setError(response.data.message || 'Failed to record payment');
      }

    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get month name
  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const remainingAmount = calculatedSalary - parseFloat(formData.paidAmount || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pay Salary</h2>
              <p className="text-sm text-gray-500">
                Record salary payment for {employee?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form id="pay-salary-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Employee Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Employee Information</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {employee?.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Role:</span> {employee?.role}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Salary Type:</span> {employee?.salaryType === 'fixed' ? 'Fixed Monthly' : 'Hourly'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Period:</span> {getMonthName(month)} {year}
              </p>
            </div>
          </div>

          {/* Salary Calculation */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Salary Calculation</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Calculated Salary:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(calculatedSalary)}
                </span>
              </div>
              {employee?.salaryType === 'hourly' && (
                <div className="text-xs text-amber-600 bg-amber-100 rounded px-2 py-1">
                  Note: Hourly employees require manual calculation of hours worked
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  max={calculatedSalary}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount to pay"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {formatCurrency(calculatedSalary)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this payment"
                />
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          {formData.paidAmount && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Summary</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(parseFloat(formData.paidAmount))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Remaining:</span>
                  <span className={`text-sm font-medium ${
                    remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
                {remainingAmount > 0 && (
                  <div className="text-xs text-amber-600 bg-amber-100 rounded px-2 py-1 mt-2">
                    Partial payment - {formatCurrency(remainingAmount)} still owed
                  </div>
                )}
                {remainingAmount < 0 && (
                  <div className="text-xs text-green-600 bg-green-100 rounded px-2 py-1 mt-2">
                    Overpayment - {formatCurrency(Math.abs(remainingAmount))} excess
                  </div>
                )}
              </div>
            </div>
          )}

          </form>
        </div>

        {/* Fixed Actions Footer */}
        <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="pay-salary-form"
            disabled={loading || !formData.paidAmount}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaySalaryModal;
