// server/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();

const { createPayment, getPayments, getPaymentById, updatePayment, deletePayment, getPaymentsForTeacher, adjustStudentDebt, getStudentDebt, payStudentDebt, cleanupDebtTransactions } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkAnyPermission } = require('../middleware/permissionMiddleware');

const checkPaymentAccess = checkAnyPermission(['finance', 'students', 'classes', 'attendance']);

// Create a payment record (Manager/Staff only)
router.post('/', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPaymentAccess, createPayment);

// Get all payments (optionally filter by student or class) (Manager/Staff only)
router.get('/', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPaymentAccess, getPayments);

// Read-only payments view for teachers, scoped to their own classes
router.get('/teacher', protect, authorize('teacher', 'manager', 'staff', 'employee', 'staff pedagogique'), checkPaymentAccess, getPaymentsForTeacher);

// Get a single payment by ID (Manager/Staff/Student)
router.get('/:id', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique', 'student'), checkPaymentAccess, getPaymentById);

// Update a payment record (Manager/Staff only)
router.put('/:id', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPaymentAccess, updatePayment);

// Delete a payment record (Manager/Staff only)
router.delete('/:id', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPaymentAccess, deletePayment);

// Manual debt adjustment (Manager only)
router.post('/adjust-debt', protect, authorize('manager'), adjustStudentDebt);

// Get student debt information (Manager only)
router.get('/student-debt/:studentId', protect, authorize('manager'), getStudentDebt);

// Pay student debt (Manager only)
router.post('/pay-debt', protect, authorize('manager'), payStudentDebt);

// Clean up debt-related manual transactions (Manager only)
router.delete('/cleanup-debt-transactions', protect, authorize('manager'), cleanupDebtTransactions);

module.exports = router;
