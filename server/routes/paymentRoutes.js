// server/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();

const { createPayment, getPayments, updatePayment, deletePayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Create a payment record (Manager/Staff only)
router.post('/', protect, authorize('manager', 'staff'), createPayment);

// Get all payments (optionally filter by student or class) (Manager/Staff only)
router.get('/', protect, authorize('manager', 'staff'), getPayments);

// Update a payment record (Manager/Staff only)
router.put('/:id', protect, authorize('manager', 'staff'), updatePayment);

// Delete a payment record (Manager/Staff only)
router.delete('/:id', protect, authorize('manager', 'staff'), deletePayment);

module.exports = router;
