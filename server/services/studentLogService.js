const StudentLog = require('../models/StudentLog');

class StudentLogService {
  static async record({
    schoolId,
    studentId,
    action,
    summary,
    details = {},
    enrollmentId = null,
    classId = null,
    actor = {},
    tags = []
  }) {
    if (!schoolId || !studentId || !action || !summary) {
      throw new Error('schoolId, studentId, action, and summary are required to record a student log');
    }

    const payload = {
      schoolId,
      studentId,
      action,
      summary,
      details,
      enrollmentId,
      classId,
      tags,
    };

    if (actor) {
      const { _id, id, role, firstName, lastName, name } = actor;
      payload.actorId = _id || id;
      payload.actorRole = role;
      payload.actorName = `${firstName || ''} ${lastName || ''}`.trim() || name || null;
    }

    const entry = await StudentLog.create(payload);
    return entry;
  }

  static async list({ schoolId, studentId, limit = 50, skip = 0, action = null, excludeActions = [] }) {
    if (!schoolId || !studentId) {
      throw new Error('schoolId and studentId are required to list student logs');
    }

    const query = { schoolId, studentId };
    if (action) {
      query.action = action;
    } else {
      const exclusions = Array.isArray(excludeActions)
        ? excludeActions.filter((value) => typeof value === 'string' && value.trim().length)
        : [];
      if (exclusions.length) {
        query.action = { $nin: exclusions };
      }
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const safeSkip = Math.max(parseInt(skip, 10) || 0, 0);

    const [items, total] = await Promise.all([
      StudentLog.find(query)
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      StudentLog.countDocuments(query)
    ]);

    return {
      items,
      total,
      pageInfo: {
        limit: safeLimit,
        skip: safeSkip,
      }
    };
  }
}

module.exports = StudentLogService;
