
const User = require('../models/User');
const Employee = require('../models/Employee');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');

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

const permissionsFromArray = (permissions = []) => {
    const next = {};
    PERMISSION_KEYS.forEach((key) => {
        next[key] = key === 'dashboard';
    });
    if (Array.isArray(permissions)) {
        permissions.forEach((key) => {
            if (PERMISSION_KEYS.includes(key)) {
                next[key] = true;
            }
        });
    }
    return next;
};

const mapEmployeeStatusFromStaff = (staffStatus) => {
    if (staffStatus === 'stopped') return 'inactive';
    return 'active';
};

const buildEmployeeRole = (overrides = {}) => (
    overrides.jobRole || overrides.position || overrides.title || overrides.employeeRole || 'Other'
);

const splitName = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
        return { firstName: 'Staff', lastName: 'User' };
    }
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: 'Staff' };
    }
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

const buildNameFromUser = (user) => {
    const fromParts = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    if (fromParts) return fromParts;
    if (user?.email) return user.email;
    return 'Staff';
};

const buildEmployeeDataFromUser = (user, overrides = {}) => ({
    schoolId: user.school,
    name: buildNameFromUser(user),
    role: buildEmployeeRole(overrides),
    employeeType: 'staff',
    salaryType: overrides.salaryType || 'fixed',
    salaryValue: overrides.salaryValue ?? user.salary ?? 0,
    hireDate: overrides.startDate || user.startDate || user.createdAt || new Date(),
    status: mapEmployeeStatusFromStaff(user.staffStatus),
    phone: user.contact?.phone1 || '',
    email: user.email || '',
    address: user.contact?.address || '',
    permissions: permissionsFromArray(user.permissions),
    userId: user._id,
    username: user.username || undefined
});

const ensureEmployeeForUser = async (user, overrides = {}) => {
    if (!user?.school || !STAFF_SYNC_ROLES.has(user.role)) return null;
    let employee = await Employee.findOne({ userId: user._id, schoolId: user.school });
    if (!employee) {
        return Employee.create(buildEmployeeDataFromUser(user, overrides));
    }

    if (overrides.jobRole || overrides.position || overrides.title || overrides.employeeRole) {
        employee.role = buildEmployeeRole(overrides);
    }
    if (overrides.salaryType) {
        employee.salaryType = overrides.salaryType;
    }
    if (overrides.salaryValue !== undefined) {
        employee.salaryValue = overrides.salaryValue;
    } else if (user.salary !== undefined) {
        employee.salaryValue = user.salary;
    }
    if (overrides.startDate || user.startDate) {
        employee.hireDate = overrides.startDate || user.startDate;
    }
    employee.name = buildNameFromUser(user);
    employee.status = mapEmployeeStatusFromStaff(user.staffStatus);
    employee.phone = user.contact?.phone1 || employee.phone;
    employee.email = user.email || employee.email;
    employee.address = user.contact?.address || employee.address;
    if (Array.isArray(user.permissions)) {
        employee.permissions = permissionsFromArray(user.permissions);
    }
    employee.username = user.username || employee.username;
    await employee.save();
    return employee;
};

// @desc    Get all staff members for the manager's school
// @route   GET /api/staff
// @access  Private/Manager
const getStaffForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'Manager is not linked to any school.' });
    }
    const staffMembers = await User.find({ 
      school: schoolId, 
      role: { $nin: ['student', 'teacher'] }
    }).select('-password');
    res.status(200).json(staffMembers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new staff member
// @route   POST /api/staff
// @access  Private/Manager
const createStaff = async (req, res) => {
    try {
    const { name, email, password, role, status } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please provide name, email, password, and role.' });
        }
        if (role === 'student') {
            return res.status(400).json({ message: 'Cannot create a student via the staff endpoint.' });
        }

        const schoolId = req.user.school;
        const staffData = { ...req.body, school: schoolId };
        if (!staffData.firstName || !staffData.lastName) {
            const { firstName, lastName } = splitName(name || 'Staff');
            staffData.firstName = staffData.firstName || firstName;
            staffData.lastName = staffData.lastName || lastName;
        }

        if (!staffData.contact) {
            const contactData = {
                phone1: req.body.phone || undefined,
                phone2: req.body.phone2 || undefined,
                address: req.body.address || undefined
            };
            if (Object.values(contactData).some((value) => value !== undefined)) {
                staffData.contact = contactData;
            }
        }
        // Map generic status to role-specific field
        if (status) {
            if (role === 'teacher') {
                staffData.teacherStatus = status;
            } else if (role === 'staff' || role === 'employee') {
                staffData.staffStatus = status;
            }
            delete staffData.status;
        }

        const userExists = await User.findOne({ email: staffData.email });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        const newStaff = new User(staffData);
        const savedStaff = await newStaff.save();

        await ensureEmployeeForUser(savedStaff, req.body);

        const staffResponse = savedStaff.toObject();
        delete staffResponse.password;

        res.status(201).json({ message: "Staff member created successfully", staff: staffResponse });
    } catch (error) {
        res.status(400).json({ message: "Error creating staff member", error: error.message });
    }
};

// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Private/Manager
const updateStaff = async (req, res) => {
    try {
        const staffMember = await User.findById(req.params.id);

        if (!staffMember || staffMember.school.toString() !== req.user.school.toString() || staffMember.role === 'student') {
            return res.status(404).json({ message: "Staff member not found in your school." });
        }

        const updateData = { ...req.body };
        delete updateData.password; // Do not update password this way
        if (!updateData.firstName || !updateData.lastName) {
            const { firstName, lastName } = splitName(req.body.name || staffMember.name || 'Staff');
            updateData.firstName = updateData.firstName || firstName;
            updateData.lastName = updateData.lastName || lastName;
        }

        if (!updateData.contact) {
            const contactData = {
                phone1: req.body.phone ?? staffMember.contact?.phone1,
                phone2: req.body.phone2 ?? staffMember.contact?.phone2,
                address: req.body.address ?? staffMember.contact?.address
            };
            if (Object.values(contactData).some((value) => value !== undefined)) {
                updateData.contact = contactData;
            }
        }
        // Map generic status to role-specific field on update
        if (updateData.status) {
            if (staffMember.role === 'teacher') {
                updateData.teacherStatus = updateData.status;
            } else if (staffMember.role === 'staff' || staffMember.role === 'employee') {
                updateData.staffStatus = updateData.status;
            }
            delete updateData.status;
        }

        const updatedStaff = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

        if (updatedStaff) {
            if (STAFF_SYNC_ROLES.has(updatedStaff.role)) {
                await ensureEmployeeForUser(updatedStaff, req.body);
            } else {
                await Employee.findOneAndUpdate(
                    { userId: updatedStaff._id, schoolId: updatedStaff.school },
                    { status: 'inactive' }
                );
            }
        }
        res.status(200).json({ message: "Staff member updated successfully", staff: updatedStaff });
    } catch (error) {
        res.status(400).json({ message: "Error updating staff member", error: error.message });
    }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private/Manager
const deleteStaff = async (req, res) => {
    try {
        const staffMember = await User.findById(req.params.id);

        if (!staffMember || staffMember.school.toString() !== req.user.school.toString() || staffMember.role === 'student') {
            return res.status(404).json({ message: "Staff member not found in your school." });
        }
        
        // Prevent a manager from deleting themselves
        if (staffMember._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot delete your own account." });
        }

        await User.findByIdAndDelete(req.params.id);
        await Employee.findOneAndUpdate(
            { userId: staffMember._id, schoolId: staffMember.school },
            { status: 'inactive' }
        );
        res.status(200).json({ message: "Staff member deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting staff member", error: error.message });
    }
};

module.exports = {
  getStaffForSchool,
  createStaff,
  updateStaff,
  deleteStaff,
};

// @desc    Staff dashboard overview for manager's school
// @route   GET /api/staff/overview
// @access  Private/Manager
const staffOverview = async (req, res) => {
    try {
        const schoolId = req.user.school;
        if (!schoolId) return res.status(400).json({ message: 'Manager not linked to school.' });
        const [students, teachers, staffCount, classes, assignments] = await Promise.all([
            User.countDocuments({ role: 'student', school: schoolId }),
            User.countDocuments({ role: 'teacher', school: schoolId }),
            User.countDocuments({ role: { $nin: ['student', 'teacher'] }, school: schoolId }),
            Class.countDocuments({ school: schoolId }),
            Assignment.countDocuments({ teacher: { $exists: true } }).exec(),
        ]);
        res.json({ students, teachers, staff: staffCount, classes, assignments });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

module.exports.staffOverview = staffOverview;