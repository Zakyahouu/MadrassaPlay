
const User = require('../models/User');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');

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