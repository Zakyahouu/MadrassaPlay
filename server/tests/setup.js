const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Allow enough time for mongodb-memory-server to download & start
jest.setTimeout(60000);

let mongo;

beforeAll(async () => {
  // Use a fresh temp download dir to avoid stale lock/md5 mismatches
  const dlDir = path.join(os.tmpdir(), `mongodb-binaries-${Date.now()}`);
  fs.mkdirSync(dlDir, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR = dlDir;
  const version = process.env.MONGOMS_VERSION || '6.0.6';
  mongo = await MongoMemoryServer.create({ binary: { version, downloadDir: dlDir } });
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri; // for connectDB if needed
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
});

afterAll(async () => {
  if (mongo) await mongo.stop();
  await mongoose.connection.close();
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});
