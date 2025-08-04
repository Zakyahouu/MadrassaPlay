// server/controllers/paymentController.js

const Payment = require('../models/Payment');

// @desc    Create a payment record
// @route   POST /api/payments
// @access  Private/Admin or Staff
const createPayment = async (req, res) => {
  try {
    const { student, class: classId, amount, dueDate } = req.body;
    if (!student || !classId || !amount || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const payment = await Payment.create({
      student,
      class: classId,
      amount,
      dueDate,
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all payments (optionally filter by student or class)
// @route   GET /api/payments
// @access  Private/Admin or Staff
const getPayments = async (req, res) => {
  try {
    const { student, class: classId } = req.query;
    const query = {};
    if (student) query.student = student;
    if (classId) query.class = classId;
    const payments = await Payment.find(query).populate('student class');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a payment record (mark as paid, overdue, etc.)
// @route   PUT /api/payments/:id
// @access  Private/Admin or Staff
const updatePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const updates = req.body;
    const payment = await Payment.findByIdAndUpdate(paymentId, updates, { new: true });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a payment record
// @route   DELETE /api/payments/:id
// @access  Private/Admin or Staff
const deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const deleted = await Payment.findByIdAndDelete(paymentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    res.status(200).json({ message: 'Payment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createPayment,
  getPayments,
  updatePayment,
  deletePayment,
};
