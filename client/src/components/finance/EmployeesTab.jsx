import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import {
  Plus,
  Users,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import AddEmployeeModal from './AddEmployeeModal';
import PaySalaryModal from './PaySalaryModal';
import EmployeeDetailModal from './EmployeeDetailModal';

const EmployeesTab = ({ schoolId, year, month, onRefresh, loading }) => {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch employees
  const fetchEmployees = async () => {
    if (!schoolId) return;

    try {
      setLoadingData(true);
      setError(null);

      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        setError(t.authenticationRequired);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get('/api/employees', config);
      
      if (response.data.success) {
        setEmployees(response.data.data);
      }

    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.message || t.failedFetchEmployees);
    } finally {
      setLoadingData(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [schoolId]);

  // Handle refresh
  const handleRefresh = () => {
    fetchEmployees();
    if (onRefresh) onRefresh();
  };

  // Handle add employee
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setShowAddModal(true);
  };

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowAddModal(true);
  };

  // Handle view employee details
  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  // Handle pay salary
  const handlePaySalary = (employee) => {
    setSelectedEmployee(employee);
    setShowPayModal(true);
  };

  // Handle delete employee
  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm(t.confirmArchiveEmployee)) {
      return;
    }

    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(`/api/employees/${employeeId}`, config);
      
      // Refresh the list
      await fetchEmployees();
      alert(t.employeeArchivedSuccessfully);

    } catch (err) {
      console.error('Error deleting employee:', err);
      alert(err.response?.data?.message || t.failedDeleteEmployee);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowAddModal(false);
    setShowPayModal(false);
    setShowDetailModal(false);
    setSelectedEmployee(null);
  };

  // Handle successful operations
  const handleSuccess = () => {
    handleModalClose();
    fetchEmployees();
    if (onRefresh) onRefresh();
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusMeta = (status) => {
    switch (status) {
      case 'active':
        return { label: t.active || 'Active', className: 'bg-green-100 text-green-800' };
      case 'on_vacation':
        return { label: t.onVacation || 'On Vacation', className: 'bg-amber-100 text-amber-800' };
      case 'inactive':
      default:
        return { label: t.inactive || 'Inactive', className: 'bg-red-100 text-red-800' };
    }
  };

  // Filter employees
  const filteredEmployees = (employees || []).filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t.loadingEmployees}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">{t.errorLoadingEmployees}</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {t.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t.employeeManagement}</h2>
              <p className="text-sm text-gray-500">
                {t.manageNonTeacherStaffSalaries}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddEmployee}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addEmployee}</span>
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.refresh}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t.searchEmployees}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t.allStatus}</option>
              <option value="active">{t.active}</option>
              <option value="on_vacation">{t.onVacation || 'On Vacation'}</option>
              <option value="inactive">{t.inactive}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.employee}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.role}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.salary}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.hireDate}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                        {employee.email && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {employee.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(employee.salaryValue)}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {employee.salaryType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(employee.hireDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const statusMeta = getStatusMeta(employee.status);
                      return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(employee)}
                        className="text-blue-600 hover:text-blue-900"
                        title={t.viewDetails}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title={t.editEmployee}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {['active', 'on_vacation'].includes(employee.status) && (
                        <button
                          onClick={() => handlePaySalary(employee)}
                          className="text-green-600 hover:text-green-900"
                          title={t.paySalary}
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEmployee(employee._id)}
                        className="text-red-600 hover:text-red-900"
                        title={t.archiveEmployee}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noEmployeesFound}</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? t.tryAdjustingSearchFilter
                : t.getStartedAddFirstEmployee
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleAddEmployee}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
{t.addEmployee}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddEmployeeModal
          employee={selectedEmployee}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {showPayModal && selectedEmployee && (
        <PaySalaryModal
          employee={selectedEmployee}
          year={year}
          month={month}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {showDetailModal && selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          year={year}
          month={month}
          onClose={handleModalClose}
          onPaySalary={() => {
            setShowDetailModal(false);
            setShowPayModal(true);
          }}
        />
      )}
    </div>
  );
};

export default EmployeesTab;
