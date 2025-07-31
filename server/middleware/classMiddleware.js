const Class = require('../models/Class');
const GradeSystem = require('../models/GradeSystem');

const validateClassCreation = async (req, res, next) => {
  try {
    const { gradeLevel, teacher, schedule } = req.body;
    const { schoolId } = req.params;

    // Validate grade system exists
    const gradeSystem = await GradeSystem.findOne({
      _id: gradeLevel.system,
      school: schoolId,
      isActive: true
    });

    if (!gradeSystem) {
      return res.status(400).json({ message: 'Invalid grade system' });
    }

    // Validate schedule conflicts
    const conflictingClass = await Class.findOne({
      school: schoolId,
      teacher,
      'schedule.day': { $in: schedule.map(s => s.day) },
      isActive: true
    });

    if (conflictingClass) {
      return res.status(400).json({ message: 'Schedule conflict with existing class' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const validateTeacherSchedule = async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    const { classId } = req.params;

    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const existingClasses = await Class.find({
      teacher: teacherId,
      isActive: true,
      _id: { $ne: classId }
    });

    const hasConflict = existingClasses.some(existingClass => 
      existingClass.schedule.some(existing =>
        targetClass.schedule.some(target =>
          existing.day === target.day &&
          ((existing.startTime <= target.startTime && target.startTime < existing.endTime) ||
           (existing.startTime < target.endTime && target.endTime <= existing.endTime))
        )
      )
    );

    if (hasConflict) {
      return res.status(400).json({ message: 'Schedule conflict with existing class' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  validateClassCreation,
  validateTeacherSchedule
};
