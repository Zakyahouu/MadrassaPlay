const asyncHandler = require('express-async-handler');
const GradeSystem = require('../models/GradeSystem');

const createGradeSystem = asyncHandler(async (req, res) => {
  const { type, levels } = req.body;
  const { schoolId } = req.params;

  const existingSystem = await GradeSystem.findOne({
    school: schoolId,
    type,
    isActive: true
  });

  if (existingSystem) {
    res.status(400);
    throw new Error(`An active ${type} grade system already exists for this school`);
  }

  const gradeSystem = await GradeSystem.create({
    school: schoolId,
    type,
    levels,
    createdBy: req.user._id
  });

  res.status(201).json(gradeSystem);
});

const getSchoolGradeSystems = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  
  const gradeSystems = await GradeSystem.find({
    school: schoolId,
    isActive: true
  }).sort('type');

  res.json(gradeSystems);
});

const updateGradeSystem = asyncHandler(async (req, res) => {
  const { levels } = req.body;
  const { schoolId, systemId } = req.params;

  const gradeSystem = await GradeSystem.findOneAndUpdate(
    {
      _id: systemId,
      school: schoolId,
      isActive: true
    },
    { levels },
    { new: true }
  );

  if (!gradeSystem) {
    res.status(404);
    throw new Error('Grade system not found');
  }

  res.json(gradeSystem);
});

module.exports = {
  createGradeSystem,
  getSchoolGradeSystems,
  updateGradeSystem
};
