const express = require('express');
const router = express.Router();
const { protect, manager } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/employeeController');

router.use(protect, manager);

router.route('/')
  .get(ctrl.listEmployees)
  .post(ctrl.createEmployee);

router.route('/:id')
  .get(ctrl.getEmployee)
  .put(ctrl.updateEmployee)
  .delete(ctrl.deleteEmployee);

module.exports = router;
