// server/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();

const { createPayment, getPayments, updatePayment, deletePayment } = require('../controllers/paymentController');
const { protect, admin, staff } = require('../middleware/authMiddleware');

// Create a payment record
router.post('/', protect, admin, createPayment);

// Get all payments (optionally filter by student or class)
router.get('/', protect, admin, getPayments);

// Update a payment record
router.put('/:id', protect, admin, updatePayment);

// Delete a payment record
router.delete('/:id', protect, admin, deletePayment);

module.exports = router;
