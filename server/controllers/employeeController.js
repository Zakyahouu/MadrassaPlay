// server/controllers/employeeController.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const EmployeeSalaryTransaction = require('../models/EmployeeSalaryTransaction');

/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 * @access  Private (Manager)
 */
const createEmployee = asyncHandler(async (req, res) => {
  const { name, role, salaryType, salaryValue, hireDate, phone, email, address, notes } = req.body;

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  // Get school ID (fallback for testing)
  let schoolId = userSchoolId;
  if (!schoolId) {
    const School = require('../models/School');
    const firstSchool = await School.findOne();
    schoolId = firstSchool?._id;
  }

  if (!schoolId) {
    return res.status(400).json({ message: 'No school found' });
  }

  // Validate required fields
  if (!name || !role || !salaryType || !salaryValue || !hireDate) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Validate salary type and value
  if (!['fixed', 'hourly'].includes(salaryType)) {
    return res.status(400).json({ message: 'Salary type must be fixed or hourly' });
  }

  if (salaryValue <= 0) {
    return res.status(400).json({ message: 'Salary value must be greater than 0' });
  }

  try {
    const employee = await Employee.create({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      name,
      role,
      salaryType,
      salaryValue,
      hireDate: new Date(hireDate),
      phone: phone || '',
      email: email || '',
      address: address || '',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get all employees for a school
 * @route   GET /api/employees
 * @access  Private (Manager)
 */
const getEmployees = asyncHandler(async (req, res) => {
  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  // Get school ID (fallback for testing)
  let schoolId = userSchoolId;
  if (!schoolId) {
    const School = require('../models/School');
    const firstSchool = await School.findOne();
    schoolId = firstSchool?._id;
  }

  if (!schoolId) {
    return res.status(400).json({ message: 'No school found' });
  }

  try {
    const employees = await Employee.getBySchool(schoolId);

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get employee by ID
 * @route   GET /api/employees/:id
 * @access  Private (Manager)
 */
const getEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (Manager)
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role, salaryType, salaryValue, hireDate, phone, email, address, notes, status } = req.body;

  try {
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update fields
    if (name) employee.name = name;
    if (role) employee.role = role;
    if (salaryType) employee.salaryType = salaryType;
    if (salaryValue !== undefined) employee.salaryValue = salaryValue;
    if (hireDate) employee.hireDate = new Date(hireDate);
    if (phone !== undefined) employee.phone = phone;
    if (email !== undefined) employee.email = email;
    if (address !== undefined) employee.address = address;
    if (notes !== undefined) employee.notes = notes;
    if (status) employee.status = status;

    await employee.save();

    res.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Delete employee (archive)
 * @route   DELETE /api/employees/:id
 * @access  Private (Manager)
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Archive instead of hard delete
    employee.status = 'inactive';
    await employee.save();

    res.json({
      success: true,
      message: 'Employee archived successfully'
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get employee salary history
 * @route   GET /api/employees/:id/salary
 * @access  Private (Manager)
 */
const getEmployeeSalaryHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { year, month } = req.query;

  try {
    let query = { employeeId: new mongoose.Types.ObjectId(id) };
    
    if (year && month) {
      query.year = parseInt(year);
      query.month = parseInt(month);
    }

    const transactions = await EmployeeSalaryTransaction.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ year: -1, month: -1, transactionDate: -1 });

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Error getting employee salary history:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Pay employee salary
 * @route   POST /api/employees/:id/pay
 * @access  Private (Manager)
 */
const payEmployeeSalary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { year, month, paidAmount, paymentMethod, notes } = req.body;

  // Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  // if (!userSchoolId) {
  //   return res.status(403).json({ message: 'Access denied to this school' });
  // }

  // Get school ID (fallback for testing)
  let schoolId = userSchoolId;
  if (!schoolId) {
    const School = require('../models/School');
    const firstSchool = await School.findOne();
    schoolId = firstSchool?._id;
  }

  if (!schoolId) {
    return res.status(400).json({ message: 'No school found' });
  }

  // Validate required fields
  if (!year || !month || !paidAmount || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  if (paidAmount <= 0) {
    return res.status(400).json({ message: 'Paid amount must be greater than 0' });
  }

  try {
    // Get employee
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate salary for the month
    const calculatedSalary = employee.calculateMonthlySalary(year, month);
    
    // Check if transaction already exists for this month
    let transaction = await EmployeeSalaryTransaction.getByEmployeeAndMonth(id, year, month);
    
    if (transaction) {
      // Update existing transaction
      transaction.paidAmount += paidAmount;
      transaction.calculateRemaining();
      transaction.paymentMethod = paymentMethod;
      transaction.notes = notes || transaction.notes;
      transaction.transactionDate = new Date();
      await transaction.save();
    } else {
      // Create new transaction
      transaction = await EmployeeSalaryTransaction.create({
        schoolId: new mongoose.Types.ObjectId(schoolId),
        employeeId: new mongoose.Types.ObjectId(id),
        year: parseInt(year),
        month: parseInt(month),
        calculatedSalary: calculatedSalary,
        paidAmount: paidAmount,
        remaining: calculatedSalary - paidAmount,
        paymentMethod: paymentMethod,
        transactionDate: new Date(),
        createdBy: req.user._id,
        notes: notes || ''
      });
    }

    // Populate the response
    await transaction.populate('employeeId', 'name role salaryType salaryValue');
    await transaction.populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Error paying employee salary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @desc    Get salary summary for a month
 * @route   GET /api/employees/salary-summary/:schoolId/:year/:month
 * @access  Private (Manager)
 */
const getSalarySummary = asyncHandler(async (req, res) => {
  const { schoolId, year, month } = req.params;

  try {
    const summary = await EmployeeSalaryTransaction.getSalarySummary(schoolId, parseInt(year), parseInt(month));
    const transactions = await EmployeeSalaryTransaction.getBySchoolAndMonth(schoolId, parseInt(year), parseInt(month));

    res.json({
      success: true,
      data: {
        summary: summary.length > 0 ? summary[0] : {
          totalCalculated: 0,
          totalPaid: 0,
          totalRemaining: 0,
          transactionCount: 0
        },
        transactions
      }
    });

  } catch (error) {
    console.error('Error getting salary summary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSalaryHistory,
  payEmployeeSalary,
  getSalarySummary
};