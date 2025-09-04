process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

function tokenFor(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
}

describe('Badge Icon Upload Validation', () => {
  let admin, auth;
  beforeAll(async () => { process.env.NODE_ENV = 'test'; await connectDB(); });
  beforeEach(async () => {
    admin = await User.create({ firstName: 'Admin', lastName: 'User', email: `admin${Date.now()}@ex.com`, password: 'pass123', role: 'admin' });
    auth = `Bearer ${tokenFor(admin)}`;
  });

  test('rejects oversized file (>2MB)', async () => {
    const bigBuffer = Buffer.alloc(2 * 1024 * 1024 + 10, 0); // just over 2MB
    const res = await request(app)
      .post('/api/template-badges/icon/upload')
      .set('Authorization', auth)
      .attach('icon', bigBuffer, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('rejects invalid mime', async () => {
    const buf = Buffer.from('plain text');
    const res = await request(app)
      .post('/api/template-badges/icon/upload')
      .set('Authorization', auth)
      .attach('icon', buf, { filename: 'file.txt', contentType: 'text/plain' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
