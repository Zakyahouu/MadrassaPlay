const asyncHandler = require('express-async-handler');
const Permission = require('../models/Permission');

// @desc    Get all permission groups with permissions
// @route   GET /api/permissions
// @access  Private (school staff)
const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find({}).sort('group');
  
  // Group permissions by their category
  const groupedPermissions = permissions.reduce((groups, permission) => {
    if (!groups[permission.group]) {
      groups[permission.group] = [];
    }
    groups[permission.group].push(permission);
    return groups;
  }, {});
  
  res.json(groupedPermissions);
});

// @desc    Initialize default permissions (used during setup)
// @route   POST /api/permissions/init
// @access  Private (admin only)
const initializePermissions = asyncHandler(async (req, res) => {
  // Check if permissions already exist
  const existingCount = await Permission.countDocuments();
  if (existingCount > 0) {
    return res.status(400).json({ message: 'Permissions are already initialized' });
  }
  
  // Default permissions grouped by category
  const defaultPermissions = [
    // Student Management
    { 
      code: 'view_students', 
      name: 'View Students', 
      description: 'Can view student profiles and basic info',
      group: 'student_management'
    },
    { 
      code: 'add_students', 
      name: 'Add Students', 
      description: 'Can add new students to the school',
      group: 'student_management'
    },
    { 
      code: 'edit_students', 
      name: 'Edit Students', 
      description: 'Can edit student information',
      group: 'student_management'
    },
    { 
      code: 'delete_students', 
      name: 'Delete Students', 
      description: 'Can remove students from the school',
      group: 'student_management'
    },
    { 
      code: 'manage_enrollment', 
      name: 'Manage Enrollment', 
      description: 'Can enroll students in classes',
      group: 'student_management'
    },
    
    // Teacher Management
    { 
      code: 'view_teachers', 
      name: 'View Teachers', 
      description: 'Can view teacher profiles and info',
      group: 'teacher_management'
    },
    { 
      code: 'add_teachers', 
      name: 'Add Teachers', 
      description: 'Can add new teachers to the school',
      group: 'teacher_management'
    },
    { 
      code: 'edit_teachers', 
      name: 'Edit Teachers', 
      description: 'Can edit teacher information',
      group: 'teacher_management'
    },
    { 
      code: 'delete_teachers', 
      name: 'Delete Teachers', 
      description: 'Can remove teachers from the school',
      group: 'teacher_management'
    },
    { 
      code: 'assign_teachers', 
      name: 'Assign Teachers', 
      description: 'Can assign teachers to classes',
      group: 'teacher_management'
    },
    
    // Class Management
    { 
      code: 'view_classes', 
      name: 'View Classes', 
      description: 'Can view classes and schedules',
      group: 'class_management'
    },
    { 
      code: 'create_classes', 
      name: 'Create Classes', 
      description: 'Can create new classes',
      group: 'class_management'
    },
    { 
      code: 'edit_classes', 
      name: 'Edit Classes', 
      description: 'Can modify class details',
      group: 'class_management'
    },
    { 
      code: 'delete_classes', 
      name: 'Delete Classes', 
      description: 'Can remove classes',
      group: 'class_management'
    },
    { 
      code: 'manage_schedules', 
      name: 'Manage Schedules', 
      description: 'Can manage class schedules',
      group: 'class_management'
    },
    
    // Grade Management
    { 
      code: 'view_grades', 
      name: 'View Grade Systems', 
      description: 'Can view grade levels and systems',
      group: 'grade_management'
    },
    { 
      code: 'create_grades', 
      name: 'Create Grade Systems', 
      description: 'Can create new grade systems',
      group: 'grade_management'
    },
    { 
      code: 'edit_grades', 
      name: 'Edit Grade Systems', 
      description: 'Can modify grade systems',
      group: 'grade_management'
    },
    { 
      code: 'delete_grades', 
      name: 'Delete Grade Systems', 
      description: 'Can remove grade systems',
      group: 'grade_management'
    },
    
    // Staff Management
    { 
      code: 'view_staff', 
      name: 'View Staff', 
      description: 'Can view staff members',
      group: 'staff_management'
    },
    { 
      code: 'add_staff', 
      name: 'Add Staff', 
      description: 'Can add new staff members',
      group: 'staff_management'
    },
    { 
      code: 'edit_staff', 
      name: 'Edit Staff', 
      description: 'Can edit staff details',
      group: 'staff_management'
    },
    { 
      code: 'delete_staff', 
      name: 'Delete Staff', 
      description: 'Can remove staff members',
      group: 'staff_management'
    },
    { 
      code: 'manage_permissions', 
      name: 'Manage Permissions', 
      description: 'Can manage staff permissions',
      group: 'staff_management'
    },
    
    // Reports
    { 
      code: 'view_reports', 
      name: 'View Reports', 
      description: 'Can view school reports and analytics',
      group: 'reports'
    },
    { 
      code: 'export_data', 
      name: 'Export Data', 
      description: 'Can export school data',
      group: 'reports'
    },
  ];
  
  // Create all permissions
  await Permission.insertMany(defaultPermissions);
  
  res.status(201).json({ message: 'Default permissions initialized successfully' });
});

module.exports = {
  getPermissions,
  initializePermissions
};
