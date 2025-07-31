const SchoolStaff = require('../models/SchoolStaff');

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Skip permission check for admin
      if (req.user.role === 'admin') {
        return next();
      }

      const { schoolId } = req.params;
      if (!schoolId) {
        return res.status(400).json({ message: 'School ID is required' });
      }

      const staffMember = await SchoolStaff.findOne({
        user: req.user._id,
        school: schoolId
      });

      if (!staffMember) {
        return res.status(403).json({ message: 'Not authorized as school staff' });
      }

      // Principals have all permissions
      if (staffMember.isPrincipal) {
        return next();
      }

      // Check for the specific permission
      if (staffMember.permissions[requiredPermission]) {
        next();
      } else {
        res.status(403).json({ message: 'Permission denied' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
};

module.exports = { checkPermission };
