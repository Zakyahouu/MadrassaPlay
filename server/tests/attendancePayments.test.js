process.env.NODE_ENV = 'test';
const request = require('supertest');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const app = require('../app');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const School = require('../models/School');
const Class = require('../models/Class');
const Room = require('../models/Room');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');

function tokenFor(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'test_secret_key', { expiresIn: '1h' });
}

async function seedBasic({ absenceRule = false, paymentModel = 'per_session' } = {}) {
  const school = await School.create({ name: `School-${Date.now()}` });
  const manager = await User.create({ firstName: 'M', lastName: 'G', email: `m${Date.now()}@ex.com`, password: 'pass', role: 'manager', school: school._id });
  const teacher = await User.create({ firstName: 'T', lastName: 'R', email: `t${Date.now()}@ex.com`, password: 'pass', role: 'teacher', experience: 1, teacherStatus: 'employed', school: school._id });
  const student = await User.create({ firstName: 'S', lastName: 'T', role: 'student', password: 'pass', school: school._id });
  const room = await Room.create({ schoolId: school._id, name: 'R1', capacity: 10, activityTypes: [] });
  const klass = await Class.create({
    name: 'C1',
    schoolId: school._id,
    catalogItem: { type: 'supportLessons', itemId: new mongoose.Types.ObjectId() },
    teacherId: teacher._id,
    roomId: room._id,
    schedules: [{ dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00' }],
    capacity: 20,
    enrollmentPeriod: { startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000) },
    paymentModel,
    sessionPrice: paymentModel === 'per_session' ? 100 : undefined,
    cycleSize: paymentModel === 'per_cycle' ? 4 : undefined,
    cyclePrice: paymentModel === 'per_cycle' ? 300 : undefined,
    teacherCut: { mode: 'percentage', value: 50 },
    absenceRule,
  });
  const enrollment = await Enrollment.create({
    schoolId: school._id,
    studentId: student._id,
    classId: klass._id,
    pricingSnapshot: {
      paymentModel,
      sessionPrice: klass.sessionPrice,
      cycleSize: klass.cycleSize,
      cyclePrice: klass.cyclePrice,
    },
  });
  return { school, manager, teacher, student, room, klass, enrollment };
}

describe('Attendance + Payments basic flows', () => {
  beforeAll(async () => {
    await connectDB();
  });

  test('mark present then undo; counters update', async () => {
    const { manager, enrollment } = await seedBasic();
    const auth = `Bearer ${tokenFor(manager)}`;
    const date = '2025-08-30';

    let res = await request(app).post('/api/attendance/mark').set('Authorization', auth).send({ enrollmentId: enrollment._id.toString(), date, status: 'present' });
    expect(res.statusCode).toBe(201);
    expect(res.body.attendance.status).toBe('present');

    // Overwrite to absent
    res = await request(app).post('/api/attendance/mark').set('Authorization', auth).send({ enrollmentId: enrollment._id.toString(), date, status: 'absent' });
    expect(res.statusCode).toBe(200);
    expect(res.body.attendance.status).toBe('absent');

    // Undo
    res = await request(app).post('/api/attendance/undo').set('Authorization', auth).send({ enrollmentId: enrollment._id.toString(), date });
    expect(res.statusCode).toBe(200);
    expect(res.body.deleted).toBe(true);

    const updated = await Enrollment.findById(enrollment._id);
    expect(updated.sessionCounters.attended).toBe(0);
    expect(updated.sessionCounters.absent).toBe(0);
    const count = await Attendance.countDocuments({ enrollmentId: enrollment._id });
    expect(count).toBe(0);
  });

  test('payments create and idempotency; list by enrollment', async () => {
    const { manager, enrollment } = await seedBasic();
    const auth = `Bearer ${tokenFor(manager)}`;

    const body = { enrollmentId: enrollment._id.toString(), amount: 200, kind: 'pay_sessions', idempotencyKey: 'abc123' };
    let res = await request(app).post('/api/payments').set('Authorization', auth).send(body);
    expect(res.statusCode).toBe(201);

    // Duplicate should 200 and return same doc
    res = await request(app).post('/api/payments').set('Authorization', auth).send(body);
    expect(res.statusCode).toBe(200);

    res = await request(app).get('/api/payments').set('Authorization', auth).query({ enrollmentId: enrollment._id.toString() });
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].amount).toBe(200);
  });
});
