const asyncHandler = require('express-async-handler');
const SchoolStaff = require('../models/SchoolStaff');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Add staff member to school
// @route   POST /api/schools/:schoolId/staff
// @access  Private/Principal or Staff with manageStaff permission
const addStaffMember = asyncHandler(async (req, res) => {
  const { name, email, password, isPrincipal, permissions } = req.body;
  const { schoolId } = req.params;

  // Check if user with email already exists
  const existingUser = await User.findOne({ email });
  
  let user;
  if (existingUser) {
    user = existingUser;
  } else {
    // Create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'staff',
      school: schoolId
    });
  }

  // Check if user is already a staff member at this school
  const existingStaff = await SchoolStaff.findOne({
    school: schoolId,
    user: user._id
  });

  if (existingStaff) {
    res.status(400);
    throw new Error('User is already a staff member at this school');
  }

  // Create staff record with permissions
  const staffMember = await SchoolStaff.create({
    school: schoolId,
    user: user._id,
    isPrincipal,
    permissions: isPrincipal ? {} : permissions // Principal has all permissions implicitly
  });

  res.status(201).json(staffMember);
});

// @desc    Get all staff members of a school
// @route   GET /api/schools/:schoolId/staff
// @access  Private/Principal or Staff with viewStaff permission
const getSchoolStaff = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  
  const staff = await SchoolStaff.find({ school: schoolId })
    .populate('user', 'name email')
    .sort('isPrincipal');

  res.json(staff);
});

// @desc    Update staff permissions
// @route   PUT /api/schools/:schoolId/staff/:staffId/permissions
// @access  Private/Principal or Staff with managePermissions
const updateStaffPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;
  const { schoolId, staffId } = req.params;

  const staffMember = await SchoolStaff.findOne({
    _id: staffId,
    school: schoolId
  });

  if (!staffMember) {
    res.status(404);
    throw new Error('Staff member not found');
  }

  // Don't allow modifying permissions for principals
  if (staffMember.isPrincipal) {
    res.status(400);
    throw new Error('Cannot modify permissions for principals');
  }

  staffMember.permissions = permissions;
  await staffMember.save();

  res.json(staffMember);
});

// @desc    Remove staff member
// @route   DELETE /api/schools/:schoolId/staff/:staffId
// @access  Private/Principal or Staff with deleteStaff
const removeStaffMember = asyncHandler(async (req, res) => {
  const { schoolId, staffId } = req.params;

  const staffMember = await SchoolStaff.findOne({
    _id: staffId,
    school: schoolId
  });

  if (!staffMember) {
    res.status(404);
    throw new Error('Staff member not found');
  }

  // Don't allow removing the last principal
  if (staffMember.isPrincipal) {
    const principalCount = await SchoolStaff.countDocuments({
      school: schoolId,
      isPrincipal: true
    });

    if (principalCount <= 1) {
      res.status(400);
      throw new Error('Cannot remove the last principal');
    }
  }

  await staffMember.deleteOne();

  res.json({ message: 'Staff member removed successfully' });
});

module.exports = {
  addStaffMember,
  getSchoolStaff,
  updateStaffPermissions,
  removeStaffMember
};
