// server/routes/classRoutes.js

const express = require('express');
const router = express.Router();

const { createClass, getClasses, updateClass, deleteClass } = require('../controllers/classController');
const { protect, admin, manager, staff } = require('../middleware/authMiddleware');

// Create a new class
router.post('/', protect, manager, createClass);

// Get all classes for a school
router.get('/', protect, manager, getClasses);

// Update a class
router.put('/:id', protect, manager, updateClass);

// Delete a class
router.delete('/:id', protect, manager, deleteClass);

module.exports = router;
