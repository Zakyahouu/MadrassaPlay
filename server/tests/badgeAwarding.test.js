const request = require('supertest');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const app = require('../app');
const TemplateBadge = require('../models/TemplateBadge');
const EarnedTemplateBadge = require('../models/EarnedTemplateBadge');
const GameCreation = require('../models/GameCreation');
const GameResult = require('../models/GameResult');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const jwt = require('jsonwebtoken');

function tokenFor(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
}

describe('Template Badge Awarding', () => {
  let student, templateId, creation, auth, owner;

  beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  });

  beforeEach(async () => {
  student = await User.create({ firstName: 'Stu', lastName: 'Dent', email: `stu${Date.now()}@ex.com`, password: 'pass123', role: 'student' });
    templateId = new mongoose.Types.ObjectId();
  owner = await User.create({ firstName: 'Teach', lastName: 'Er', email: `t${Date.now()}@ex.com`, password: 'pass123', role: 'teacher', experience: 0, teacherStatus: 'employed' });
  creation = await GameCreation.create({ template: templateId, owner: owner._id, name: 'Game 1', config: {}, content: [] });
    await TemplateBadge.create({
      template: templateId,
      name: 'Quiz Master',
      evaluationMode: 'highestAttempt',
      variants: [
        { label: 'Gold', thresholdPercent: 90 },
        { label: 'Silver', thresholdPercent: 70 },
        { label: 'Bronze', thresholdPercent: 50 }
      ]
    });
    auth = `Bearer ${tokenFor(student)}`;
  });

  test('awards bronze then upgrades to silver then gold based on highestAttempt', async () => {
    const Assignment = require('../models/Assignment');
    const assignment = await Assignment.create({
      teacher: owner._id,
      title: 'A1',
      students: [student._id],
      gameCreations: [creation._id],
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 3600_000)
    });
    await GameResult.create({ student: student._id, gameCreation: creation._id, assignment: assignment._id, score: 5, totalPossibleScore: 10 }); // 50%
    await GameResult.create({ student: student._id, gameCreation: creation._id, assignment: assignment._id, score: 7, totalPossibleScore: 10 }); // 70%
    await GameResult.create({ student: student._id, gameCreation: creation._id, assignment: assignment._id, score: 9, totalPossibleScore: 10 }); // 90%

    const badge = await TemplateBadge.findOne({ template: templateId });
    // simulate evaluation after last game result
    const controller = require('../controllers/templateBadgeController');
    await controller.evaluateTemplateBadgeForResult({ userId: student._id, gameCreationId: creation._id, percentage: 90 });

    const earned = await EarnedTemplateBadge.findOne({ user: student._id, templateBadge: badge._id });
    expect(earned).toBeTruthy();
    expect(earned.variantLabel).toBe('Gold');
    expect(earned.percentage).toBe(90);
  });

  test('firstAttempt mode locks in first result', async () => {
    // replace badge with firstAttempt
    await TemplateBadge.deleteMany({});
    await TemplateBadge.create({
      template: templateId,
      name: 'First Try',
      evaluationMode: 'firstAttempt',
      variants: [
        { label: 'Elite', thresholdPercent: 80 },
        { label: 'Achiever', thresholdPercent: 60 }
      ]
    });

    const assignment2 = await Assignment.create({
      teacher: owner._id,
      title: 'A2',
      students: [student._id],
      gameCreations: [creation._id],
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 3600_000)
    });
    await GameResult.create({ student: student._id, gameCreation: creation._id, assignment: assignment2._id, score: 6, totalPossibleScore: 10 }); // 60%
    await GameResult.create({ student: student._id, gameCreation: creation._id, assignment: assignment2._id, score: 9, totalPossibleScore: 10 }); // 90% but should not upgrade

    const controller = require('../controllers/templateBadgeController');
    await controller.evaluateTemplateBadgeForResult({ userId: student._id, gameCreationId: creation._id, percentage: 90 });

    const badge = await TemplateBadge.findOne({ template: templateId });
    const earned = await EarnedTemplateBadge.findOne({ user: student._id, templateBadge: badge._id });
    expect(earned.variantLabel).toBe('Achiever');
    expect(earned.percentage).toBe(60);
  });
});
