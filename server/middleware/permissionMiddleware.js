const Employee = require('../models/Employee');

/**
 * Middleware to check if a staff user has permission to access a specific section
 * @param {string} section - The section to check permission for ('finance' or 'logs')
 */
const checkPermission = (section) => {
  return async (req, res, next) => {
    try {
      // Only check permissions for staff users
      if (req.user.role !== 'staff') {
        return next();
      }

      // Find the employee record for this staff user
      console.log('Looking for employee with userId:', req.user._id, 'schoolId:', req.user.school);
      const employee = await Employee.findOne({
        userId: req.user._id,
        schoolId: req.user.school
      });

      console.log('Found employee:', employee ? 'Yes' : 'No');
      if (employee) {
        console.log('Employee permissions:', employee.permissions);
      }

      if (!employee) {
        return res.status(403).json({
          success: false,
          message: 'Employee record not found. Please contact your administrator.'
        });
      }

      // Check if the employee has permission for the requested section
      console.log(`Checking ${section} permission for employee:`, employee.permissions);
      console.log(`Permission for ${section}:`, employee.permissions?.[section]);
      console.log(`Permission type:`, typeof employee.permissions?.[section]);
      console.log(`Permission value:`, employee.permissions?.[section]);
      console.log(`Is truthy:`, !!employee.permissions?.[section]);
      
      if (!employee.permissions || employee.permissions[section] !== true) {
        console.log(`Access denied for ${section} - permissions:`, employee.permissions);
        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to access the ${section} section.`
        });
      }
      
      console.log(`Access granted for ${section}`);

      // Add employee info to request for use in controllers
      req.employee = employee;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions. Please try again.'
      });
    }
  };
};

/**
 * Middleware to check finance access
 */
const checkFinanceAccess = checkPermission('finance');

/**
 * Middleware to check logs access
 */
const checkLogsAccess = checkPermission('logs');

module.exports = {
  checkPermission,
  checkFinanceAccess,
  checkLogsAccess
};
