// server/controllers/employeeController.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const EmployeeSalaryTransaction = require('../models/EmployeeSalaryTransaction');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const LoggingService = require('../services/loggingService');

const STAFF_SYNC_ROLES = new Set(['staff', 'employee', 'staff pedagogique']);
const PERMISSION_KEYS = [
  'dashboard',
  'classes',
  'students',
  'teachers',
  'attendance',
  'timetable',
  'employees',
  'finance',
  'logs',
  'rooms',
  'equipment',
  'catalog',
  'ads',
  'landingPage',
  'reports',
  'settings'
];

const normalizePermissionValue = (value) => value === true || value === 'true';

const buildPermissions = (incoming = {}, base = {}) => {
  const next = {};
  PERMISSION_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(incoming, key)) {
      next[key] = normalizePermissionValue(incoming[key]);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      next[key] = base[key];
      return;
    }
    next[key] = key === 'dashboard';
  });
  return next;
};

const permissionsToArray = (permissions = {}) => PERMISSION_KEYS.filter((key) => permissions[key]);

const permissionsFromArray = (permissions = []) => {
  const next = buildPermissions({});
  if (Array.isArray(permissions)) {
    permissions.forEach((key) => {
      if (PERMISSION_KEYS.includes(key)) {
        next[key] = true;
      }
    });
  }
  return next;
};

const mapStaffStatusFromEmployee = (status) => {
  if (!status) return undefined;
  if (status === 'inactive') return 'stopped';
  if (status === 'on_vacation') return 'on_vacation';
  return status;
};

const mapEmployeeStatusFromStaff = (staffStatus) => {
  if (staffStatus === 'stopped') return 'inactive';
  if (staffStatus === 'on_vacation') return 'on_vacation';
  return 'active';
};

const splitName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: 'Employee', lastName: 'User' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Employee' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
};

const buildNameFromUser = (user) => {
  const fromParts = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  if (fromParts) return fromParts;
  if (user?.email) return user.email;
  return 'Staff';
};

const extractUserId = (employee) => {
  if (!employee?.userId) return null;
  if (typeof employee.userId === 'string') return employee.userId;
  if (employee.userId._id) return employee.userId._id.toString();
  return employee.userId.toString();
};

const buildEmployeeDataFromUser = (user, schoolId, options = {}) => {
  const includeUsername = options.includeUsername !== false;
  const parsedSalary = Number(user.salary);
  const normalizedSalary = Number.isFinite(parsedSalary) && parsedSalary > 0 ? parsedSalary : 1;
  return {
  schoolId: new mongoose.Types.ObjectId(schoolId),
  name: buildNameFromUser(user),
  role: 'Other',
  employeeType: 'staff',
  salaryType: 'fixed',
  salaryValue: normalizedSalary,
  hireDate: user.startDate || user.createdAt || new Date(),
  status: mapEmployeeStatusFromStaff(user.staffStatus),
  phone: user.contact?.phone1 || '',
  email: user.email || '',
  address: user.contact?.address || '',
  permissions: permissionsFromArray(user.permissions),
  userId: user._id,
  username: includeUsername ? (user.username || undefined) : undefined
  };
};

const mergeEmployeeWithUser = (employee, user) => {
  if (!employee) return null;
  const merged = { ...employee };
  if (user) {
    merged.user = user;
    merged.email = merged.email || user.email || '';
    merged.username = merged.username || user.username || '';
    merged.phone = merged.phone || user.contact?.phone1 || '';
    merged.address = merged.address || user.contact?.address || '';
    merged.contact = user.contact || merged.contact;
    merged.banking = user.banking || merged.banking;
    merged.contractType = user.contractType || merged.contractType;
    merged.startDate = user.startDate || merged.hireDate || merged.startDate;
    if (user.salary !== undefined) {
      merged.salary = user.salary;
    }
    merged.staffStatus = user.staffStatus || merged.staffStatus;
    merged.userRole = user.role || merged.userRole;
    if (!merged.permissions || Object.keys(merged.permissions).length === 0) {
      merged.permissions = permissionsFromArray(user.permissions);
    }
  }
  if (merged.password) {
    delete merged.password;
  }
  return merged;
};

const userSelect = 'firstName lastName email username role contact banking contractType startDate salary staffStatus permissions';

/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 * @access  Private (Manager)
 */
const createEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    role,
    employeeType,
    salaryType,
    salaryValue,
    hireDate,
    phone,
    phone2,
    email,
    address,
    notes,
    status,
    username,
    password,
    permissions,
    contact,
    banking,
    contractType,
    startDate,
    salary
  } = req.body;
  // Check if user has access to this school
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();

  if (!userSchoolId) {
    return res.status(400).json({
      success: false,
      message: 'No school associated with your account. Please contact an administrator.'
    });
  }

  const resolvedEmployeeType = employeeType || 'other';
  const normalizedUsername = typeof username === 'string' ? username.trim() : username;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

  // Validate required fields
  if (!name || !role || !salaryType || salaryValue === undefined || salaryValue === null || !hireDate) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Validate employee type
  if (!['staff', 'other'].includes(resolvedEmployeeType)) {
    return res.status(400).json({ message: 'Employee type must be staff or other' });
  }

  // For staff employees, validate platform access fields
  if (resolvedEmployeeType === 'staff') {
    if (!normalizedEmail || !normalizedUsername || !password) {
      return res.status(400).json({ message: 'Staff employees require email, username, and password' });
    }
  }

  // Validate salary type and value
  if (!['fixed', 'hourly'].includes(salaryType)) {
    return res.status(400).json({ message: 'Salary type must be fixed or hourly' });
  }


  const numericSalaryValue = Number(salaryValue);
  if (!Number.isFinite(numericSalaryValue) || numericSalaryValue <= 0) {
    return res.status(400).json({ message: 'Salary value must be greater than 0' });
  }

  try {
    const contactData = {
      phone1: contact?.phone1 ?? phone ?? '',
      phone2: contact?.phone2 ?? phone2 ?? '',
      address: contact?.address ?? address ?? ''
    };
    const bankingData = banking && typeof banking === 'object' ? banking : undefined;
    const employeeData = {
      schoolId: new mongoose.Types.ObjectId(userSchoolId),
      name,
      role,
      employeeType: resolvedEmployeeType,
      salaryType,
      salaryValue: numericSalaryValue,
      hireDate: new Date(hireDate),
      status: status || 'active',
      phone: contactData.phone1,
      email: normalizedEmail || '',
      address: contactData.address,
      notes: notes || ''
    };

    // Add platform access fields for staff
    if (resolvedEmployeeType === 'staff') {
      const staffPermissions = buildPermissions(permissions);
      employeeData.username = normalizedUsername;

      // Add permissions for staff
      employeeData.permissions = staffPermissions;

      console.log('Saving permissions for staff employee:', employeeData.permissions);
      console.log('Received permissions from request:', permissions);
      console.log('Finance permission type:', typeof permissions?.finance, 'Value:', permissions?.finance);
      console.log('Logs permission type:', typeof permissions?.logs, 'Value:', permissions?.logs);
    }

    const employee = await Employee.create(employeeData);

    // If this is a staff employee, also create a User record for login
    if (resolvedEmployeeType === 'staff') {
      try {
        const userFilters = [];
        if (normalizedEmail) userFilters.push({ email: normalizedEmail });
        if (normalizedUsername) userFilters.push({ username: normalizedUsername });
        if (userFilters.length > 0) {
          const existingUser = await User.findOne({ $or: userFilters });
          if (existingUser) {
            await Employee.findByIdAndDelete(employee._id);
            return res.status(400).json({
              success: false,
              message: 'A user with this email or username already exists'
            });
          }
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { firstName, lastName } = splitName(name);

        // Create User record
        const userData = {
          firstName,
          lastName,
          email: normalizedEmail,
          username: normalizedUsername,
          password: hashedPassword,
          role: 'staff',
          school: new mongoose.Types.ObjectId(userSchoolId),
          contact: contactData,
          banking: bankingData,
          contractType: contractType,
          startDate: startDate ? new Date(startDate) : new Date(hireDate),
          salary: salary !== undefined && salary !== null ? Number(salary) : numericSalaryValue,
          staffStatus: mapStaffStatusFromEmployee(status),
          permissions: permissionsToArray(buildPermissions(permissions))
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

    const hydratedEmployee = await Employee.findById(employee._id)
      .populate('userId', userSelect)
      .lean();
    const mergedEmployee = mergeEmployeeWithUser(hydratedEmployee, hydratedEmployee?.userId);

    res.status(201).json({
      success: true,
      data: mergedEmployee
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    if (error?.code === 11000) {
      const key = Object.keys(error.keyPattern || error.keyValue || {})[0];
      const field = key || 'value';
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different ${field}.`
      });
    }
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
    const staffRoles = Array.from(STAFF_SYNC_ROLES);
    let employees = await Employee.find({ schoolId: new mongoose.Types.ObjectId(userSchoolId) })
      .populate('userId', userSelect)
      .lean();

    const existingUserIds = new Set(
      employees
        .map((employee) => extractUserId(employee))
        .filter(Boolean)
    );

    const staffUsers = await User.find({
      school: userSchoolId,
      role: { $in: staffRoles }
    })
      .select(userSelect)
      .lean();

    const missingStaffUsers = staffUsers.filter((user) => !existingUserIds.has(user._id.toString()));
    if (missingStaffUsers.length > 0) {
      const backfillData = missingStaffUsers.map((user) =>
        buildEmployeeDataFromUser(user, userSchoolId, { includeUsername: false })
      );

      if (backfillData.length > 0) {
        try {
          await Employee.insertMany(backfillData, { ordered: false });
        } catch (error) {
          if (error?.code !== 11000) {
            throw error;
          }
        }
        employees = await Employee.find({ schoolId: new mongoose.Types.ObjectId(userSchoolId) })
          .populate('userId', userSelect)
          .lean();
      }
    }

    const employeesWithDefaults = employees.map((employee) => {
      const normalized = {
        ...employee,
        employeeType: employee.employeeType || 'other'
      };
      return mergeEmployeeWithUser(normalized, employee.userId);
    });

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
    const employee = await Employee.findById(id)
      .populate('userId', userSelect)
      .lean();

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      success: true,
      data: mergeEmployeeWithUser(employee, employee.userId)
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
  const {
    name,
    role,
    employeeType,
    salaryType,
    salaryValue,
    hireDate,
    phone,
    phone2,
    email,
    address,
    notes,
    status,
    username,
    password,
    permissions,
    contact,
    banking,
    contractType,
    startDate,
    salary
  } = req.body;
  const normalizedUsername = typeof username === 'string' ? username.trim() : username;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

  try {
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const nextEmployeeType = employeeType || employee.employeeType;
    if (employeeType && !['staff', 'other'].includes(employeeType)) {
      return res.status(400).json({ message: 'Employee type must be staff or other' });
    }

    const resolvedPhone = contact?.phone1 ?? phone;
    const resolvedAddress = contact?.address ?? address;

    // Update fields
    if (name !== undefined) employee.name = name;
    if (role !== undefined) employee.role = role;
    if (employeeType !== undefined) employee.employeeType = employeeType;
    if (salaryType !== undefined) {
      if (!['fixed', 'hourly'].includes(salaryType)) {
        return res.status(400).json({ message: 'Salary type must be fixed or hourly' });
      }
      employee.salaryType = salaryType;
    }
    if (salaryValue !== undefined) {
      const numericSalaryValue = Number(salaryValue);
      if (!Number.isFinite(numericSalaryValue) || numericSalaryValue <= 0) {
        return res.status(400).json({ message: 'Salary value must be greater than 0' });
      }
      employee.salaryValue = numericSalaryValue;
    }
    if (startDate || hireDate) employee.hireDate = new Date(startDate || hireDate);
    if (resolvedPhone !== undefined) employee.phone = resolvedPhone;
    if (normalizedEmail !== undefined) employee.email = normalizedEmail;
    if (resolvedAddress !== undefined) employee.address = resolvedAddress;
    if (notes !== undefined) employee.notes = notes;
    if (status !== undefined) employee.status = status;
    if (normalizedUsername !== undefined) employee.username = normalizedUsername;

    // Update permissions if provided (and if employee is staff)
    if (nextEmployeeType === 'staff' && permissions) {
      employee.permissions = buildPermissions(permissions, employee.permissions);
    } else if (nextEmployeeType === 'staff' && !employee.permissions) {
      employee.permissions = buildPermissions({}, employee.permissions);
    }

    let user = null;
    if (employee.userId) {
      user = await User.findById(employee.userId);
    }

    if (nextEmployeeType === 'staff' && !user) {
      if (!normalizedEmail || !normalizedUsername || !password) {
        return res.status(400).json({ message: 'Staff employees require email, username, and password' });
      }
      const userFilters = [];
      if (normalizedEmail) userFilters.push({ email: normalizedEmail });
      if (normalizedUsername) userFilters.push({ username: normalizedUsername });
      if (userFilters.length > 0) {
        const existingUser = await User.findOne({ $or: userFilters });
        if (existingUser) {
          return res.status(400).json({ message: 'A user with this email or username already exists' });
        }
      }
      const { firstName, lastName } = splitName(name || employee.name);
      user = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        username: normalizedUsername,
        password,
        role: 'staff',
        school: employee.schoolId,
        contact: {
          phone1: resolvedPhone || '',
          phone2: contact?.phone2 ?? phone2 ?? '',
          address: resolvedAddress || ''
        },
        banking: banking && typeof banking === 'object' ? banking : undefined,
        contractType: contractType,
        startDate: startDate ? new Date(startDate) : employee.hireDate,
        salary: salary !== undefined && salary !== null ? Number(salary) : employee.salaryValue,
        staffStatus: mapStaffStatusFromEmployee(status),
        permissions: permissionsToArray(buildPermissions(permissions, employee.permissions))
      });
      employee.userId = user._id;
    }

    if (user) {
      if (normalizedEmail !== undefined && normalizedEmail !== user.email) {
        const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (existingEmail) {
          return res.status(400).json({ message: 'A user with this email already exists' });
        }
        user.email = normalizedEmail;
      }
      if (normalizedUsername !== undefined && normalizedUsername !== user.username) {
        const existingUsername = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
        if (existingUsername) {
          return res.status(400).json({ message: 'A user with this username already exists' });
        }
        user.username = normalizedUsername;
      }
      if (name !== undefined) {
        const { firstName, lastName } = splitName(name);
        user.firstName = firstName;
        user.lastName = lastName;
      }
      if (password) {
        user.password = password;
      }

      const contactUpdates = {};
      if (contact?.phone1 !== undefined || phone !== undefined) {
        contactUpdates.phone1 = contact?.phone1 ?? phone ?? '';
      }
      if (contact?.phone2 !== undefined || phone2 !== undefined) {
        contactUpdates.phone2 = contact?.phone2 ?? phone2 ?? '';
      }
      if (contact?.address !== undefined || address !== undefined) {
        contactUpdates.address = contact?.address ?? address ?? '';
      }
      if (Object.keys(contactUpdates).length > 0) {
        user.contact = { ...user.contact, ...contactUpdates };
      }

      if (banking && typeof banking === 'object') {
        user.banking = { ...user.banking, ...banking };
      }
      if (contractType !== undefined) {
        user.contractType = contractType;
      }
      if (startDate || hireDate) {
        user.startDate = new Date(startDate || hireDate);
      }
      if (salary !== undefined) {
        user.salary = Number(salary);
      } else if (salaryValue !== undefined) {
        user.salary = Number(salaryValue);
      }
      if (status !== undefined) {
        user.staffStatus = mapStaffStatusFromEmployee(status);
      }
      if (employeeType && employeeType !== 'staff') {
        user.staffStatus = 'stopped';
      }
      if (permissions) {
        user.permissions = permissionsToArray(buildPermissions(permissions, employee.permissions));
      }
      if (nextEmployeeType === 'staff' && !STAFF_SYNC_ROLES.has(user.role)) {
        user.role = 'staff';
      }
      await user.save();
    }

    await employee.save();

    const hydratedEmployee = await Employee.findById(employee._id)
      .populate('userId', userSelect)
      .lean();

    res.json({
      success: true,
      data: mergeEmployeeWithUser(hydratedEmployee, hydratedEmployee?.userId)
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

    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { staffStatus: 'stopped' });
    }

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

  // Check if user has access to this school
  const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();

  if (!userSchoolId) {
    return res.status(403).json({ message: 'Access denied to this school' });
  }

  const schoolId = userSchoolId;

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

    if (!['active', 'on_vacation'].includes(employee.status)) {
      return res.status(400).json({ message: 'salaryPaymentNotAllowed' });
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
    let employee = await Employee.findOne({
      username: username,
      schoolId: userSchoolId
    })
      .populate('userId', userSelect)
      .lean();

    if (!employee) {
      const staffUser = await User.findOne({
        username: username,
        school: userSchoolId,
        role: { $in: Array.from(STAFF_SYNC_ROLES) }
      })
        .select(userSelect)
        .lean();

      if (!staffUser) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      const createdEmployee = await Employee.create(buildEmployeeDataFromUser(staffUser, userSchoolId));
      employee = await Employee.findById(createdEmployee._id)
        .populate('userId', userSelect)
        .lean();
    }

    res.json({
      success: true,
      data: mergeEmployeeWithUser(employee, employee.userId)
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
    let employee = await Employee.findOne({
      userId: userId,
      schoolId: userSchoolId
    })
      .populate('userId', userSelect)
      .lean();

    if (!employee) {
      const staffUser = await User.findOne({
        _id: userId,
        school: userSchoolId,
        role: { $in: Array.from(STAFF_SYNC_ROLES) }
      })
        .select(userSelect)
        .lean();

      if (!staffUser) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      const createdEmployee = await Employee.create(buildEmployeeDataFromUser(staffUser, userSchoolId));
      employee = await Employee.findById(createdEmployee._id)
        .populate('userId', userSelect)
        .lean();
    }

    console.log('Returning employee data for user ID:', userId, {
      id: employee?._id,
      permissions: employee?.permissions,
      financeType: typeof employee?.permissions?.finance,
      logsType: typeof employee?.permissions?.logs
    });

    res.json({
      success: true,
      data: mergeEmployeeWithUser(employee, employee.userId)
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