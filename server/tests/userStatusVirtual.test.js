const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

describe('User status virtual mapping', () => {
  beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  });

  it('returns teacherStatus via status virtual for teachers', async () => {
    const u = await User.create({
      firstName: 'T', lastName: 'One', email: 't1@example.com', password: 'pass', role: 'teacher',
      experience: 1,
      teacherStatus: 'freelance'
    });
    const found = await User.findById(u._id);
    expect(found.status).toBe('freelance');
  });

  it('returns staffStatus via status virtual for staff', async () => {
    const u = await User.create({
      firstName: 'S', lastName: 'One', email: 's1@example.com', password: 'pass', role: 'staff',
      staffStatus: 'on_vacation'
    });
    const found = await User.findById(u._id);
    expect(found.status).toBe('on_vacation');
  });

  it('allows employee without email and uses status virtual', async () => {
    const u = await User.create({
      firstName: 'E', lastName: 'NoEmail', password: 'pass', role: 'employee', staffStatus: 'stopped'
    });
    const found = await User.findById(u._id);
    expect(found.email).toBeUndefined();
    expect(found.status).toBe('stopped');
  });
});
