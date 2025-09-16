// server/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();

const { createPayment, getPayments, getPaymentById, updatePayment, deletePayment, getPaymentsForTeacher, adjustStudentDebt, getStudentDebt, payStudentDebt, cleanupDebtTransactions } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Create a payment record (Manager/Staff only)
router.post('/', protect, authorize('manager', 'staff'), createPayment);

// Get all payments (optionally filter by student or class) (Manager/Staff only)
router.get('/', protect, authorize('manager', 'staff'), getPayments);

// Read-only payments view for teachers, scoped to their own classes
router.get('/teacher', protect, authorize('teacher', 'manager', 'staff'), getPaymentsForTeacher);

// Get a single payment by ID (Manager/Staff/Student)
router.get('/:id', protect, authorize('manager', 'staff', 'student'), getPaymentById);

// Update a payment record (Manager/Staff only)
router.put('/:id', protect, authorize('manager', 'staff'), updatePayment);

// Delete a payment record (Manager/Staff only)
router.delete('/:id', protect, authorize('manager', 'staff'), deletePayment);

// Manual debt adjustment (Manager only)
router.post('/adjust-debt', protect, authorize('manager'), adjustStudentDebt);

// Get student debt information (Manager only)
router.get('/student-debt/:studentId', protect, authorize('manager'), getStudentDebt);

// Pay student debt (Manager only)
router.post('/pay-debt', protect, authorize('manager'), payStudentDebt);

// Clean up debt-related manual transactions (Manager only)
router.delete('/cleanup-debt-transactions', protect, authorize('manager'), cleanupDebtTransactions);

module.exports = router;
