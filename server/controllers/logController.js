const asyncHandler = require('express-async-handler');
const LoggingService = require('../services/loggingService');

// Get activity logs with filters
const getActivityLogs = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const filters = req.query;

  try {
    const result = await LoggingService.getActivityLogs(schoolId, filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs'
    });
  }
});

// Get activity statistics
const getActivityStats = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { days = 30 } = req.query;

  try {
    const stats = await LoggingService.getActivityStats(schoolId, parseInt(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics'
    });
  }
});

// Get recent activities
const getRecentActivities = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { limit = 20 } = req.query;

  try {
    const result = await LoggingService.getActivityLogs(schoolId, { 
      limit: parseInt(limit),
      page: 1 
    });
    
    res.json({
      success: true,
      data: result.logs
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
});

// Get activity logs by user
const getActivityLogsByUser = asyncHandler(async (req, res) => {
  const { schoolId, userId } = req.params;
  const filters = { ...req.query, userId };

  try {
    const result = await LoggingService.getActivityLogs(schoolId, filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity logs'
    });
  }
});

// Get activity logs by category
const getActivityLogsByCategory = asyncHandler(async (req, res) => {
  const { schoolId, category } = req.params;
  const filters = { ...req.query, category };

  try {
    const result = await LoggingService.getActivityLogs(schoolId, filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching category activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category activity logs'
    });
  }
});

// Export activity logs
const exportActivityLogs = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const filters = req.query;

  try {
    // Get all logs without pagination for export
    const result = await LoggingService.getActivityLogs(schoolId, { ...filters, limit: 10000 });
    
    // Format data for CSV export
    const csvData = result.logs.map(log => ({
      timestamp: log.timestamp,
      user: log.userName,
      role: log.userRole,
      action: log.action,
      description: log.description,
      category: log.category,
      severity: log.severity,
      ipAddress: log.ipAddress
    }));

    res.json({
      success: true,
      data: csvData
    });
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export activity logs'
    });
  }
});

// Clear old activity logs (admin only)
const clearOldLogs = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { days = 90 } = req.body; // Keep logs for specified days

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await ActivityLog.deleteMany({
      school: schoolId,
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} old activity logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing old logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear old logs'
    });
  }
});

module.exports = {
  getActivityLogs,
  getActivityStats,
  getRecentActivities,
  getActivityLogsByUser,
  getActivityLogsByCategory,
  exportActivityLogs,
  clearOldLogs
};
