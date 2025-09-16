import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  DollarSign,
  Calendar,
  User,
  BookOpen,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const TransactionsTable = ({ transactions, formatCurrency, formatDate, loading, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter and search transactions
  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.student.name.toLowerCase().includes(searchLower) ||
      transaction.class.name.toLowerCase().includes(searchLower) ||
      transaction.note?.toLowerCase().includes(searchLower) ||
      transaction.kind.toLowerCase().includes(searchLower)
    );
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'student':
        aValue = a.student.name;
        bValue = b.student.name;
        break;
      case 'class':
        aValue = a.class.name;
        bValue = b.class.name;
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'debt':
        aValue = a.debtDelta;
        bValue = b.debtDelta;
        break;
      default:
        aValue = a[sortBy];
        bValue = b[sortBy];
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

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
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
        <p className="text-gray-500">No payment transactions found for this month.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Search and Filter Bar */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="student">Student</option>
              <option value="class">Class</option>
              <option value="amount">Amount</option>
              <option value="debt">Debt Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <span>{getSortIcon('date')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('student')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Student</span>
                  <span>{getSortIcon('student')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('class')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Class</span>
                  <span>{getSortIcon('class')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Amount</span>
                  <span>{getSortIcon('amount')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('debt')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Debt Status</span>
                  <span>{getSortIcon('debt')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTransactions.map((transaction) => {
              const debtStatus = getDebtStatus(transaction.debtDelta);
              
              return (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      {formatDate(transaction.date)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.student.name}
                        </div>
                        {transaction.student.studentCode && (
                          <div className="text-sm text-gray-500">
                            {transaction.student.studentCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">
                        {transaction.class.name}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </div>
                    {transaction.expectedPrice && transaction.expectedPrice !== transaction.amount && (
                      <div className="text-xs text-gray-500">
                        Expected: {formatCurrency(transaction.expectedPrice)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${debtStatus.bgColor} ${debtStatus.color}`}>
                      {debtStatus.text === 'Owed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {debtStatus.text === 'Credit' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {debtStatus.text === 'Paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {debtStatus.text}
                    </span>
                    {transaction.debtDelta !== 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {transaction.debtDelta > 0 ? '+' : ''}{formatCurrency(transaction.debtDelta)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPaymentKindIcon(transaction.kind)}
                      <span className="ml-2 text-sm text-gray-900">
                        {transaction.kind.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => onViewDetails(transaction._id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedTransactions.length)} of {sortedTransactions.length} transactions
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
