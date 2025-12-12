process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const connectDB = require('../config/db');
const School = require('../models/School');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');

function tokenFor(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
}

beforeAll(async () => { await connectDB(); });

describe('Manager Landing Page APIs', () => {
  test('manager can update landing page', async () => {
    const school = await School.create({ name: `Sch-${Date.now()}` });
    const manager = await User.create({ firstName: 'MG', lastName: 'User', email: `m${Date.now()}@ex.com`, password: 'pass123', role: 'manager', school: school._id });
    const token = `Bearer ${tokenFor(manager)}`;

    const payload = { isEnabled: true, heroTitle: 'Hi Parents', aboutSection: 'About here' };
    const res = await request(app).put('/api/schools/my-school/landing-page').set('Authorization', token).send(payload);
    expect(res.status).toBe(200);
    expect(res.body.landingPage).toBeDefined();
    expect(res.body.landingPage.heroTitle).toBe('Hi Parents');

    const dbSchool = await School.findById(school._id);
    expect(dbSchool.landingPage?.isEnabled).toBe(true);
  });

  test('manager can upload landing image', async () => {
    const school = await School.create({ name: `Sch2-${Date.now()}` });
    const manager = await User.create({ firstName: 'MG2', lastName: 'User', email: `m2${Date.now()}@ex.com`, password: 'pass123', role: 'manager', school: school._id });
    const token = `Bearer ${tokenFor(manager)}`;
    const sample = path.join(__dirname, 'fixtures', 'small.png');

    const res = await request(app).post('/api/schools/my-school/landing-page/upload').set('Authorization', token).attach('image', sample);
    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
  });
});
