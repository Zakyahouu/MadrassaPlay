// server/controllers/employeeController.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const EmployeeSalaryTransaction = require('../models/EmployeeSalaryTransaction');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const LoggingService = require('../services/loggingService');

/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 * @access  Private (Manager)
 */
const createEmployee = asyncHandler(async (req, res) => {
  const { name, role, employeeType, salaryType, salaryValue, hireDate, phone, email, address, notes, username, password, permissions } = req.body;

  // Check if user has access to this school
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  
  if (!userSchoolId) {
    return res.status(400).json({ 
      success: false,
      message: 'No school associated with your account. Please contact an administrator.' 
    });
  }

  // Validate required fields
  if (!name || !role || !employeeType || !salaryType || !salaryValue || !hireDate) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Validate employee type
  if (!['staff', 'other'].includes(employeeType)) {
    return res.status(400).json({ message: 'Employee type must be staff or other' });
  }

  // For staff employees, validate platform access fields
  if (employeeType === 'staff') {
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Staff employees require email, username, and password' });
    }
  }

  // Validate salary type and value
  if (!['fixed', 'hourly'].includes(salaryType)) {
    return res.status(400).json({ message: 'Salary type must be fixed or hourly' });
  }

  
  if (salaryValue <= 0) {
    return res.status(400).json({ message: 'Salary value must be greater than 0' });
  }

  try {
    const employeeData = {
      schoolId: new mongoose.Types.ObjectId(userSchoolId),
      name,
      role,
      employeeType,
      salaryType,
      salaryValue,
      hireDate: new Date(hireDate),
      phone: phone || '',
      email: email || '',
      address: address || '',
      notes: notes || ''
    };

    // Add platform access fields for staff
    if (employeeType === 'staff') {
      employeeData.username = username;
      employeeData.password = password; // Note: In production, this should be hashed
      
      // Add permissions for staff
      employeeData.permissions = {
        finance: permissions?.finance === true || permissions?.finance === 'true',
        logs: permissions?.logs === true || permissions?.logs === 'true'
      };
      
      console.log('Saving permissions for staff employee:', employeeData.permissions);
      console.log('Received permissions from request:', permissions);
      console.log('Finance permission type:', typeof permissions?.finance, 'Value:', permissions?.finance);
      console.log('Logs permission type:', typeof permissions?.logs, 'Value:', permissions?.logs);
    }

    const employee = await Employee.create(employeeData);

    // If this is a staff employee, also create a User record for login
    if (employeeType === 'staff') {
      try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User record
        const userData = {
          firstName: name.split(' ')[0] || name,
          lastName: name.split(' ').slice(1).join(' ') || '',
          name: name,
          email: email,
          username: username,
          password: hashedPassword,
          role: 'staff',
          school: new mongoose.Types.ObjectId(userSchoolId),
          contact: {
            phone1: phone || '',
            address: address || ''
          }
        };

        const user = await User.create(userData);
        
        // Link the employee to the user
        employee.userId = user._id;
        await employee.save();

        console.log(`Created User record for staff employee: ${user.username}`);
        console.log(`User ID: ${user._id}, Employee ID: ${employee._id}`);
        console.log(`User school: ${user.school}, Employee school: ${employee.schoolId}`);
        console.log(`User permissions:`, employee.permissions);
      } catch (userError) {
        console.error('Error creating User record for staff employee:', userError);
        // If User creation fails, delete the employee record
        await Employee.findByIdAndDelete(employee._id);
        return res.status(500).json({
          success: false,
          message: 'Failed to create user account for staff employee',
          error: userError.message
        });
      }
    }

    // Log the activity
    await LoggingService.logManagerActivity(req, 'manager_employee_create', 
      `Created new employee: ${employee.name} (${employee.employeeType})`, 
      { employeeId: employee._id, employeeType: employee.employeeType, role: employee.role },
      { entityType: 'employee', entityId: employee._id }
    );

    res.status(201).json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
});

/**
 * @desc    Get all employees for a school
 * @route   GET /api/employees
 * @access  Private (Manager)
 */
const getEmployees = asyncHandler(async (req, res) => {
  console.log('Getting employees for user:', req.user);
  
  // Check if user has access to this school
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();
  console.log('User school ID:', userSchoolId);
  
  if (!userSchoolId) {
    console.log('User has no school associated');
    return res.status(400).json({ 
      success: false,
      message: 'No school associated with your account. Please contact an administrator.' 
    });
  }

  try {
    const employees = await Employee.getBySchool(userSchoolId);

    // Ensure all employees have employeeType field (for backward compatibility)
    const employeesWithDefaults = employees.map(emp => ({
      ...emp,
      employeeType: emp.employeeType || 'other'
    }));

    res.json({
      success: true,
      data: employeesWithDefaults
    });

  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
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

    // Log the salary payment activity
    await LoggingService.logManagerActivity(req, 'manager_salary_pay', 
      `Paid salary of ${paidAmount} DZD to employee ${employee.name} for ${year}-${month}`, 
      { employeeId: employee._id, amount: paidAmount, year, month, paymentMethod },
      { entityType: 'employee', entityId: employee._id }
    );

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

// @desc    Get employee by username
// @route   GET /api/employees/by-username/:username
// @access  Private (Staff)
const getEmployeeByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();

  if (!userSchoolId) {
    return res.status(400).json({ 
      success: false,
      message: 'No school associated with your account' 
    });
  }

  try {
    const employee = await Employee.findOne({
      username: username,
      schoolId: userSchoolId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error getting employee by username:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// @desc    Get employee by user ID
// @route   GET /api/employees/by-user/:userId
// @access  Private (Staff)
const getEmployeeByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();

  if (!userSchoolId) {
    return res.status(400).json({ 
      success: false,
      message: 'No school associated with your account' 
    });
  }

  try {
    const employee = await Employee.findOne({
      userId: userId,
      schoolId: userSchoolId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log('Returning employee data for user ID:', userId, {
      id: employee._id,
      permissions: employee.permissions,
      financeType: typeof employee.permissions?.finance,
      logsType: typeof employee.permissions?.logs
    });
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error getting employee by user ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
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
  getSalarySummary,
  getEmployeeByUsername,
  getEmployeeByUserId
};