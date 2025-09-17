const ActivityLog = require('../models/ActivityLog');

class LoggingService {
  /**
   * Log an activity
   * @param {Object} params - Log parameters
   * @param {string} params.schoolId - School ID
   * @param {string} params.userId - User ID
   * @param {string} params.userRole - User role
   * @param {string} params.userName - User name
   * @param {string} params.action - Action performed
   * @param {string} params.description - Description of the action
   * @param {Object} params.details - Additional details
   * @param {string} params.ipAddress - IP address
   * @param {string} params.userAgent - User agent
   * @param {string} params.severity - Severity level
   * @param {string} params.category - Category
   * @param {Object} params.relatedEntity - Related entity info
   */
  static async logActivity({
    schoolId,
    userId,
    userRole,
    userName,
    action,
    description,
    details = {},
    ipAddress = 'unknown',
    userAgent = 'unknown',
    severity = 'low',
    category,
    relatedEntity = null
  }) {
    try {
      const logEntry = new ActivityLog({
        school: schoolId,
        user: userId,
        userRole,
        userName,
        action,
        description,
        details,
        ipAddress,
        userAgent,
        severity,
        category,
        relatedEntity
      });

      await logEntry.save();
      return logEntry;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to prevent breaking the main functionality
      return null;
    }
  }

  /**
   * Log student activity
   */
  static async logStudentActivity(req, action, description, details = {}, relatedEntity = null) {
    const user = req.user;
    if (!user || user.role !== 'student') return null;

    return await this.logActivity({
      schoolId: user.school,
      userId: user._id,
      userRole: user.role,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
      action,
      description,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: 'low',
      category: 'student_management',
      relatedEntity
    });
  }

  /**
   * Log teacher activity
   */
  static async logTeacherActivity(req, action, description, details = {}, relatedEntity = null) {
    const user = req.user;
    if (!user || user.role !== 'teacher') return null;

    return await this.logActivity({
      schoolId: user.school,
      userId: user._id,
      userRole: user.role,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
      action,
      description,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: 'low',
      category: 'teacher_management',
      relatedEntity
    });
  }

  /**
   * Log manager activity
   */
  static async logManagerActivity(req, action, description, details = {}, relatedEntity = null) {
    const user = req.user;
    if (!user || user.role !== 'manager') return null;

    return await this.logActivity({
      schoolId: user.school,
      userId: user._id,
      userRole: user.role,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
      action,
      description,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'system',
      relatedEntity
    });
  }

  /**
   * Log staff/employee activity
   */
  static async logStaffActivity(req, action, description, details = {}, relatedEntity = null) {
    const user = req.user;
    if (!user || (user.role !== 'staff' && user.role !== 'employee')) return null;

    return await this.logActivity({
      schoolId: user.school,
      userId: user._id,
      userRole: user.role,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
      action,
      description,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: 'low',
      category: 'employee_management',
      relatedEntity
    });
  }

  /**
   * Log authentication activity
   */
  static async logAuthActivity(req, action, description, details = {}, userId = null, userRole = null, userName = null) {
    const user = req.user || { _id: userId, role: userRole, school: req.body?.school };
    
    return await this.logActivity({
      schoolId: user.school,
      userId: user._id,
      userRole: user.role,
      userName: userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
      action,
      description,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'authentication',
      relatedEntity: null
    });
  }

  /**
   * Log system activity
   */
  static async logSystemActivity(schoolId, action, description, details = {}, severity = 'medium') {
    return await this.logActivity({
      schoolId,
      userId: null,
      userRole: 'system',
      userName: 'System',
      action,
      description,
      details,
      ipAddress: 'system',
      userAgent: 'system',
      severity,
      category: 'system',
      relatedEntity: null
    });
  }

  /**
   * Get activity logs with filters
   */
  static async getActivityLogs(schoolId, filters = {}) {
    const {
      page = 1,
      limit = 50,
      userRole = null,
      action = null,
      category = null,
      severity = null,
      startDate = null,
      endDate = null,
      search = null
    } = filters;

    const query = { school: schoolId };

    // Apply filters
    if (userRole) query.userRole = userRole;
    if (action) query.action = action;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'firstName lastName name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(schoolId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await ActivityLog.aggregate([
      { $match: { school: schoolId, timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          byRole: {
            $push: {
              role: '$userRole',
              action: '$action',
              category: '$category'
            }
          },
          byCategory: {
            $push: '$category'
          },
          bySeverity: {
            $push: '$severity'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalActivities: 0,
        byRole: {},
        byCategory: {},
        bySeverity: {},
        recentActivities: []
      };
    }

    const data = stats[0];
    
    // Process role statistics
    const byRole = {};
    data.byRole.forEach(item => {
      if (!byRole[item.role]) {
        byRole[item.role] = { total: 0, actions: {} };
      }
      byRole[item.role].total++;
      byRole[item.role].actions[item.action] = (byRole[item.role].actions[item.action] || 0) + 1;
    });

    // Process category statistics
    const byCategory = {};
    data.byCategory.forEach(category => {
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    // Process severity statistics
    const bySeverity = {};
    data.bySeverity.forEach(severity => {
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    });

    // Get recent activities
    const recentActivities = await ActivityLog.find({ school: schoolId })
      .populate('user', 'firstName lastName name')
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    return {
      totalActivities: data.totalActivities,
      byRole,
      byCategory,
      bySeverity,
      recentActivities
    };
  }
}

module.exports = LoggingService;
