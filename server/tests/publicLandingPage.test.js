process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const connectDB = require('../config/db');
const School = require('../models/School');

beforeAll(async () => { await connectDB(); });

describe('Public Landing Page', () => {
  test('returns 404 for disabled or missing landing page', async () => {
    const s = await School.create({ name: `NoLanding-${Date.now()}`, contact: {} });
    const res = await request(app).get(`/api/public/landing-page/${s._id}`);
    expect(res.status).toBe(404);
  });

  test('returns landing page when enabled', async () => {
    const name = `Landing-${Date.now()}`;
    const s = await School.create({
      name,
      contact: {},
      landingPage: {
        isEnabled: true,
        heroTitle: 'Welcome!',
        aboutSection: 'About our school',
        contactPhone: '123',
        contactEmail: 'info@test.com',
        galleryImages: ['https://example.com/image.png']
      }
    });
    const res = await request(app).get(`/api/public/landing-page/${s._id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(name);
    expect(res.body.pageContent).toBeDefined();
    expect(res.body.pageContent.heroTitle).toBe('Welcome!');
    expect(Array.isArray(res.body.pageContent.galleryImages)).toBe(true);
  });
});
