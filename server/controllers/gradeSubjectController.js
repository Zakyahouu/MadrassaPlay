const asyncHandler = require('express-async-handler');
const GradeSubject = require('../models/GradeSubject');

const setGradeSubjects = asyncHandler(async (req, res) => {
  const { gradeLevel, subjects } = req.body;
  const { schoolId } = req.params;

  let gradeSubject = await GradeSubject.findOne({
    school: schoolId,
    'gradeLevel.system': gradeLevel.system,
    'gradeLevel.level': gradeLevel.level
  });

  if (gradeSubject) {
    gradeSubject.subjects = subjects;
    gradeSubject = await gradeSubject.save();
  } else {
    gradeSubject = await GradeSubject.create({
      school: schoolId,
      gradeLevel,
      subjects,
      createdBy: req.user._id
    });
  }

  res.json(gradeSubject);
});

const getGradeSubjects = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { gradeSystemId, level } = req.query;

  const query = { school: schoolId };
  if (gradeSystemId) {
    query['gradeLevel.system'] = gradeSystemId;
  }
  if (level) {
    query['gradeLevel.level'] = level;
  }

  const gradeSubjects = await GradeSubject.find(query)
    .populate('gradeLevel.system', 'name type');

  res.json(gradeSubjects);
});

module.exports = {
  setGradeSubjects,
  getGradeSubjects
};
