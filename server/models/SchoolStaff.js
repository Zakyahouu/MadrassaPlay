const mongoose = require('mongoose');

const schoolStaffSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrincipal: {
    type: Boolean,
    default: false
  },
  // Define all possible permissions as booleans
  permissions: {
    // Student Management
    viewStudents: { type: Boolean, default: false },
    manageStudents: { type: Boolean, default: false },
    deleteStudents: { type: Boolean, default: false },
    manageEnrollments: { type: Boolean, default: false },
    
    // Teacher Management
    viewTeachers: { type: Boolean, default: false },
    manageTeachers: { type: Boolean, default: false },
    deleteTeachers: { type: Boolean, default: false },
    assignTeachers: { type: Boolean, default: false },
    
    // Class Management
    viewClasses: { type: Boolean, default: false },
    manageClasses: { type: Boolean, default: false },
    deleteClasses: { type: Boolean, default: false },
    manageSchedules: { type: Boolean, default: false },
    
    // Grade System Management
    viewGradeSystems: { type: Boolean, default: false },
    manageGradeSystems: { type: Boolean, default: false },
    deleteGradeSystems: { type: Boolean, default: false },
    
    // Staff Management
    viewStaff: { type: Boolean, default: false },
    manageStaff: { type: Boolean, default: false },
    managePermissions: { type: Boolean, default: false },
    deleteStaff: { type: Boolean, default: false },
    
    // Reports & Data Access
    viewReports: { type: Boolean, default: false },
    exportData: { type: Boolean, default: false },
    viewAnalytics: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SchoolStaff', schoolStaffSchema);
