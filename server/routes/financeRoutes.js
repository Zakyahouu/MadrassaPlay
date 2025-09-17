// server/routes/financeRoutes.js

const express = require('express');
const router = express.Router();
const {
  getFinancialOverview,
  getTransactions,
  recalculateMonthlyData,
  getTeacherPayouts,
  recordTeacherPayout,
  getTeacherPayoutDetails,
  getManualTransactions,
  addManualTransaction,
  deleteManualTransaction,
  freezeMonth,
  getIncomeExpenseTrends,
  getTeacherPayoutDistribution,
  getStudentDebtTrends,
  getExpenseCategories,
  getEmployeeSalaryAnalytics
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkFinanceAccess } = require('../middleware/permissionMiddleware');

// All routes are protected and require Manager role
router.use(protect);
router.use(authorize('manager'));
router.use(checkFinanceAccess);

// @route   GET /api/finance/overview/:schoolId/:year/:month
// @desc    Get financial overview for a specific month
// @access  Private (Manager)
router.get('/overview/:schoolId/:year/:month', getFinancialOverview);

// @route   GET /api/finance/student-payments/:schoolId/:year/:month
// @desc    Get transactions for a specific month
// @access  Private (Manager)
router.get('/student-payments/:schoolId/:year/:month', getTransactions);

// @route   POST /api/finance/calculate/:schoolId/:year/:month
// @desc    Recalculate monthly financial data
// @access  Private (Manager)
router.post('/calculate/:schoolId/:year/:month', recalculateMonthlyData);

// @route   GET /api/finance/teachers/:schoolId/:year/:month
// @desc    Get teacher payouts for a specific month
// @access  Private (Manager)
router.get('/teachers/:schoolId/:year/:month', getTeacherPayouts);

// @route   POST /api/finance/teachers/pay/:teacherId
// @desc    Record a teacher payout
// @access  Private (Manager)
router.post('/teachers/pay/:teacherId', recordTeacherPayout);

// @route   GET /api/finance/teachers/:teacherId/:year/:month
// @desc    Get teacher payout details
// @access  Private (Manager)
router.get('/teachers/:teacherId/:year/:month', getTeacherPayoutDetails);

// @route   GET /api/finance/transactions/:schoolId/:year/:month
// @desc    Get manual transactions for a specific month
// @access  Private (Manager)
router.get('/transactions/:schoolId/:year/:month', getManualTransactions);

// @route   POST /api/finance/transactions/add
// @desc    Add a manual transaction
// @access  Private (Manager)
router.post('/transactions/add', addManualTransaction);

// @route   DELETE /api/finance/transactions/delete/:id
// @desc    Delete a manual transaction
// @access  Private (Manager)
router.delete('/transactions/delete/:id', deleteManualTransaction);

// @route   POST /api/finance/freeze/:schoolId/:year/:month
// @desc    Freeze a month's financial data
// @access  Private (Manager)
router.post('/freeze/:schoolId/:year/:month', freezeMonth);

// Analytics routes
// @route   GET /api/finance/analytics/trends/:schoolId/:year/:month
// @desc    Get income vs expenses for selected month
// @access  Private (Manager)
router.get('/analytics/trends/:schoolId/:year/:month', getIncomeExpenseTrends);

// @route   GET /api/finance/analytics/teacher-payouts/:schoolId/:year/:month
// @desc    Get teacher payout distribution
// @access  Private (Manager)
router.get('/analytics/teacher-payouts/:schoolId/:year/:month', getTeacherPayoutDistribution);

// @route   GET /api/finance/analytics/debt-trends/:schoolId/:year/:month
// @desc    Get student debt trends for selected month
// @access  Private (Manager)
router.get('/analytics/debt-trends/:schoolId/:year/:month', getStudentDebtTrends);

// @route   GET /api/finance/analytics/expense-categories/:schoolId/:year/:month
// @desc    Get expense categories breakdown
// @access  Private (Manager)
router.get('/analytics/expense-categories/:schoolId/:year/:month', getExpenseCategories);

// @route   GET /api/finance/analytics/employee-salaries/:schoolId/:year/:month
// @desc    Get employee salary analytics
// @access  Private (Manager)
router.get('/analytics/employee-salaries/:schoolId/:year/:month', getEmployeeSalaryAnalytics);

module.exports = router;