process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const TemplateBadge = require('../models/TemplateBadge');
const GameCreation = require('../models/GameCreation');
const GameResult = require('../models/GameResult');
const EarnedTemplateBadge = require('../models/EarnedTemplateBadge');
const User = require('../models/User');
const controller = require('../controllers/templateBadgeController');

function tokenFor(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
}

describe('TemplateBadge validation & progress listing', () => {
  let admin, adminAuth;
  let student, studentAuth;
  beforeAll(async () => { process.env.NODE_ENV = 'test'; await connectDB(); });
  beforeEach(async () => {
  admin = await User.create({ firstName: 'Admin', lastName: 'User', email: `admin${Date.now()}@ex.com`, password: 'pass123', role: 'admin' });
    adminAuth = `Bearer ${tokenFor(admin)}`;
  student = await User.create({ firstName: 'Stu', lastName: 'Dent', email: `stu${Date.now()}@ex.com`, password: 'pass123', role: 'student' });
    studentAuth = `Bearer ${tokenFor(student)}`;
  });

  test('rejects duplicate thresholdPercent', async () => {
    const templateId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/template-badges')
      .set('Authorization', adminAuth)
      .send({
        template: templateId,
        name: 'Dup Threshold',
        evaluationMode: 'highestAttempt',
        variants: [
          { label: 'Gold', thresholdPercent: 80 },
          { label: 'Silver', thresholdPercent: 80 }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Duplicate variant thresholdPercent/);
  });

  test('rejects duplicate label', async () => {
    const templateId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/template-badges')
      .set('Authorization', adminAuth)
      .send({
        template: templateId,
        name: 'Dup Label',
        evaluationMode: 'highestAttempt',
        variants: [
          { label: 'Tier', thresholdPercent: 90 },
            { label: 'Tier', thresholdPercent: 70 }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Duplicate variant label/);
  });

  test('progress listing returns current + next variant info', async () => {
    const templateId = new mongoose.Types.ObjectId();
    // Create badge via model (simpler) or via API (need admin). Use API to stay closer to flow.
    await request(app)
      .post('/api/template-badges')
      .set('Authorization', adminAuth)
      .send({
        template: templateId,
        name: 'Progress Badge',
        evaluationMode: 'highestAttempt',
        variants: [
          { label: 'Gold', thresholdPercent: 90 },
          { label: 'Silver', thresholdPercent: 70 },
          { label: 'Bronze', thresholdPercent: 50 }
        ]
      })
      .expect(201);

    // Game creation + results
  const creationOwner = await User.create({ firstName: 'Teach', lastName: 'Er', email: `t${Date.now()}@ex.com`, password: 'pass123', role: 'teacher', experience: 0, teacherStatus: 'employed' });
  const creation = await GameCreation.create({ template: templateId, owner: creationOwner._id, name: 'Game 1', config: {}, content: [] });
    const Assignment = require('../models/Assignment');
    const assignment = await Assignment.create({
      teacher: creationOwner._id,
      title: 'A1',
      students: [student._id],
      gameCreations: [creation._id],
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 3600_000)
    });
    await GameResult.create({ student: student._id, gameCreation: creation._id, assignment: assignment._id, score: 5, totalPossibleScore: 10 }); // 50
    await GameResult.create({ student: student._id, gameCreation: creation._id, assignment: assignment._id, score: 7, totalPossibleScore: 10 }); // 70

    // Evaluate (simulating post-result hook)
  await controller.evaluateTemplateBadgeForResult({ userId: student._id, gameCreationId: creation._id, percentage: 70 });

    const listRes = await request(app)
      .get('/api/template-badges/me/list')
      .set('Authorization', studentAuth)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    const entry = listRes.body.find(e => e.templateBadge && e.templateBadge.name === 'Progress Badge');
    expect(entry).toBeTruthy();
    expect(entry.progress.percentage).toBe(70);
    expect(entry.progress.currentThreshold).toBe(70); // Silver
    expect(entry.progress.nextVariant.label).toBe('Gold');
    expect(entry.progress.nextVariant.thresholdPercent).toBe(90);
    expect(entry.progress.neededForNext).toBe(20); // 90 - 70
  });
});
