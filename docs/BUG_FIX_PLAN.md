# MadrassaPlay Bug Fix Plan

> Comprehensive plan for fixing all identified bugs with testing procedures.
> Generated: January 22, 2026

---

## Overview

| Priority | Bug ID | Title | Estimated Time | Risk Level |
|----------|--------|-------|----------------|------------|
| 🔴 Critical | BUG-001 | Auth Middleware Missing Return | 15 min | High |
| 🔴 Critical | BUG-002 | Payment Update No Authorization | 30 min | High |
| 🟠 High | BUG-003 | Finance Authorization Disabled | 20 min | Medium |
| 🟠 High | BUG-004 | getPaymentById No Authorization | 20 min | Medium |
| 🟠 High | BUG-005 | Socket.IO No Authentication | 45 min | Medium |
| 🟠 High | BUG-006 | Memory Leak in liveGames | 30 min | Low |
| 🟡 Medium | BUG-007 | Double Password Hashing | 25 min | Medium |
| 🟡 Medium | BUG-008 | Race Condition Payment/Balance | 45 min | High |
| 🟡 Medium | BUG-009 | Floating Point Session Calculations | 20 min | Low |
| 🟡 Medium | BUG-010 | Token Expiration Not Checked | 30 min | Low |
| 🟡 Medium | BUG-011 | Hardcoded Socket URL | 10 min | Low |
| 🟡 Medium | BUG-012 | Username Global Uniqueness | 35 min | Medium |

**Total Estimated Time: ~5.5 hours**

---

## Recommended Fix Order

1. **Phase 1 - Critical Security (Day 1)**
   - BUG-001: Auth Middleware
   - BUG-002: Payment Authorization
   - BUG-003: Finance Authorization
   - BUG-004: Payment Read Authorization

2. **Phase 2 - Security Hardening (Day 1-2)**
   - BUG-005: Socket Authentication
   - BUG-007: Double Password Hashing

3. **Phase 3 - Data Integrity (Day 2)**
   - BUG-008: Race Condition
   - BUG-009: Floating Point
   - BUG-012: Username Uniqueness

4. **Phase 4 - Stability & Polish (Day 3)**
   - BUG-006: Memory Leak
   - BUG-010: Token Expiration
   - BUG-011: Hardcoded URL

---

## BUG-001: Auth Middleware Missing Return Statement

### Problem
The `protect` middleware in `server/middleware/authMiddleware.js` doesn't return after calling `next()`, causing the "no token" response to be sent even after successful authentication.

### Current Code (Lines 5-28)
```javascript
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').populate('school');
      next(); // ❌ Missing return
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {  // ❌ This runs even when token IS present
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
```

### Fix
```javascript
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').populate('school');
      return next(); // ✅ Added return
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // Only reaches here if no authorization header
  return res.status(401).json({ message: 'Not authorized, no token' });
};
```

### Testing Procedure

#### Pre-Fix Test (Reproduce Bug)
```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"password123"}' | jq -r '.token')

# 2. Make authenticated request - check server logs for "headers already sent" error
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer $TOKEN"

# Expected bug behavior: May get error or inconsistent responses
```

#### Post-Fix Test (Verify Fix)
```bash
# 1. Test with valid token
curl -s -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer $TOKEN" | jq '.length'
# Expected: Returns student count (number)

# 2. Test with invalid token
curl -s -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer invalidtoken123"
# Expected: {"message":"Not authorized, token failed"}

# 3. Test with no token
curl -s -X GET http://localhost:5000/api/students
# Expected: {"message":"Not authorized, no token"}

# 4. Check server logs for NO "headers already sent" errors
pm2 logs madrassaplay-api --lines 50 | grep -i "headers"
# Expected: No matches
```

#### Automated Test
```javascript
// server/tests/auth.test.js
describe('Auth Middleware', () => {
  it('should allow access with valid token', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).not.toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, token failed');
  });

  it('should reject missing token', async () => {
    const res = await request(app)
      .get('/api/students');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, no token');
  });
});
```

---

## BUG-002: Payment Update/Delete No Authorization

### Problem
`updatePayment` and `deletePayment` in `server/controllers/paymentController.js` don't verify that the payment belongs to the user's school.

### Current Code (Lines 294-322)
```javascript
const updatePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const updates = req.body;
    // ❌ No authorization check - any manager can update any payment
    const payment = await Payment.findByIdAndUpdate(paymentId, updates, { new: true });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    // ❌ No authorization check
    const deleted = await Payment.findByIdAndDelete(paymentId);
    // ...
  }
};
```

### Fix
```javascript
const updatePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const updates = req.body;
    
    // Validate payment ID
    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID.' });
    }
    
    // Get user's school
    const schoolIdRaw = req.user?.school?._id || req.user?.school;
    if (!schoolIdRaw) {
      return res.status(400).json({ message: 'User is not assigned to a school.' });
    }
    
    // Find payment and verify ownership
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    
    // ✅ Authorization check
    if (payment.schoolId.toString() !== schoolIdRaw.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this payment.' });
    }
    
    // Prevent modifying critical fields
    const safeUpdates = { ...updates };
    delete safeUpdates.schoolId;
    delete safeUpdates.studentId;
    delete safeUpdates.enrollmentId;
    
    const updatedPayment = await Payment.findByIdAndUpdate(paymentId, safeUpdates, { new: true });
    res.status(200).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    
    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID.' });
    }
    
    const schoolIdRaw = req.user?.school?._id || req.user?.school;
    if (!schoolIdRaw) {
      return res.status(400).json({ message: 'User is not assigned to a school.' });
    }
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    
    // ✅ Authorization check
    if (payment.schoolId.toString() !== schoolIdRaw.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this payment.' });
    }
    
    // Reverse balance changes before deleting
    if (payment.enrollmentId) {
      // Consider reversing the balance increment
      // await Enrollment.updateOne({ _id: payment.enrollmentId }, { $inc: { balance: -sessionsAdded } });
    }
    
    await Payment.findByIdAndDelete(paymentId);
    res.status(200).json({ message: 'Payment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
```

### Testing Procedure

#### Pre-Fix Test (Reproduce Bug)
```bash
# 1. Login as Manager A (School A)
TOKEN_A=$(curl -s -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager_a@test.com","password":"password123"}' | jq -r '.token')

# 2. Get a payment ID from School B
PAYMENT_B_ID="6789..."  # Get from database

# 3. Try to update School B's payment as Manager A
curl -X PUT http://localhost:5000/api/payments/$PAYMENT_B_ID \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"amount": 0}'
# BUG: This succeeds when it should fail
```

#### Post-Fix Test (Verify Fix)
```bash
# 1. Same setup as above

# 2. Try to update School B's payment as Manager A
curl -s -X PUT http://localhost:5000/api/payments/$PAYMENT_B_ID \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"amount": 999}'
# Expected: {"message":"Not authorized to update this payment."}

# 3. Update own school's payment
PAYMENT_A_ID="..."
curl -s -X PUT http://localhost:5000/api/payments/$PAYMENT_A_ID \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"note": "Updated note"}'
# Expected: Returns updated payment object

# 4. Verify schoolId cannot be changed
curl -s -X PUT http://localhost:5000/api/payments/$PAYMENT_A_ID \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"schoolId": "differentSchoolId"}'
# Expected: schoolId should remain unchanged in response
```

#### Automated Test
```javascript
describe('Payment Authorization', () => {
  it('should reject updating payment from different school', async () => {
    const res = await request(app)
      .put(`/api/payments/${otherSchoolPaymentId}`)
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({ amount: 999 });
    expect(res.status).toBe(403);
  });

  it('should allow updating own school payment', async () => {
    const res = await request(app)
      .put(`/api/payments/${ownPaymentId}`)
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({ note: 'test' });
    expect(res.status).toBe(200);
  });
});
```

---

## BUG-003: Finance Authorization Disabled

### Problem
Authorization checks in `server/controllers/financeController.js` are commented out with "TEMPORARILY DISABLED FOR TESTING".

### Current Code (Multiple locations)
```javascript
// Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();

// if (!userSchoolId || userSchoolId !== schoolId) {
//   return res.status(403).json({ message: 'Access denied to this school' });
// }
```

### Fix
```javascript
// Check if user has access to this school
const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();

if (!userSchoolId || userSchoolId !== schoolId) {
  return res.status(403).json({ message: 'Access denied to this school' });
}
```

### Files to Update
- `server/controllers/financeController.js` - Lines ~35, ~85, ~225, ~385

### Testing Procedure

#### Pre-Fix Test (Reproduce Bug)
```bash
# 1. Login as Manager A
TOKEN_A=$(curl -s -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager_a@test.com","password":"password123"}' | jq -r '.token')

# 2. Get School B's ID
SCHOOL_B_ID="..."

# 3. Access School B's financial data
curl -s -X GET "http://localhost:5000/api/finance/overview/$SCHOOL_B_ID/2026/1" \
  -H "Authorization: Bearer $TOKEN_A"
# BUG: Returns School B's data when it should be denied
```

#### Post-Fix Test (Verify Fix)
```bash
# 1. Try to access another school's finance
curl -s -X GET "http://localhost:5000/api/finance/overview/$SCHOOL_B_ID/2026/1" \
  -H "Authorization: Bearer $TOKEN_A"
# Expected: {"message":"Access denied to this school"}

# 2. Access own school's finance
SCHOOL_A_ID="..."
curl -s -X GET "http://localhost:5000/api/finance/overview/$SCHOOL_A_ID/2026/1" \
  -H "Authorization: Bearer $TOKEN_A"
# Expected: Returns financial data
```

---

## BUG-004: getPaymentById No Authorization

### Problem
`getPaymentById` in `server/controllers/paymentController.js` has authorization check commented out.

### Current Code (Lines 210-235)
```javascript
const getPaymentById = async (req, res) => {
  try {
    const paymentId = req.params.id;
    // ... validation ...

    const payment = await Payment.findById(paymentId)
      .populate('studentId', 'firstName lastName studentCode')
      .populate('classId', 'name')
      .lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Authorization check (optional, depending on requirements)  ❌ COMMENTED OUT
    // const schoolIdRaw = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    // if (payment.schoolId.toString() !== schoolIdRaw?.toString()) {
    //   return res.status(403).json({ message: 'Not authorized to view this payment.' });
    // }

    res.status(200).json(payment);
  } catch (error) {
    // ...
  }
};
```

### Fix
```javascript
const getPaymentById = async (req, res) => {
  try {
    const paymentId = req.params.id;
    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID.' });
    }

    const payment = await Payment.findById(paymentId)
      .populate('studentId', 'firstName lastName studentCode')
      .populate('classId', 'name')
      .lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // ✅ Authorization check - enabled
    const schoolIdRaw = req.user?.school?._id || req.user?.school;
    if (!schoolIdRaw || payment.schoolId.toString() !== schoolIdRaw.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this payment.' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('getPaymentById error:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
```

### Testing Procedure

#### Post-Fix Test
```bash
# 1. Try to access another school's payment
curl -s -X GET "http://localhost:5000/api/payments/$OTHER_SCHOOL_PAYMENT" \
  -H "Authorization: Bearer $TOKEN_A"
# Expected: {"message":"Not authorized to view this payment."}

# 2. Access own payment
curl -s -X GET "http://localhost:5000/api/payments/$OWN_PAYMENT" \
  -H "Authorization: Bearer $TOKEN_A"
# Expected: Returns payment object with studentId, classId populated
```

---

## BUG-005: Socket.IO No Authentication

### Problem
Socket.IO connections in `server/socket/socketHandler.js` don't verify user identity. Anyone can join game rooms.

### Current Code
```javascript
socket.on('join-game', async ({ roomCode, playerName, userId } = {}) => {
  // ❌ No verification that userId is legitimate
  const room = liveGames[roomCode];
  if (!room) { socket.emit('join-error', 'Room not found'); return; }
  // Player just claims to be userId without verification
  room.players.push({ id: socket.id, userId, name: playerName });
  // ...
});
```

### Fix

#### Step 1: Add Socket Auth Middleware
```javascript
// server/socket/socketAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      // Allow anonymous connections for public pages, but mark as unauthenticated
      socket.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id firstName lastName role school');
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    // Token invalid - allow connection but mark as unauthenticated
    socket.user = null;
    next();
  }
};

module.exports = socketAuth;
```

#### Step 2: Update server.js
```javascript
const socketAuth = require('./socket/socketAuth');

// After creating io
io.use(socketAuth);
```

#### Step 3: Update socketHandler.js
```javascript
socket.on('join-game', async ({ roomCode, playerName } = {}) => {
  try {
    const room = liveGames[roomCode];
    if (!room) { socket.emit('join-error', 'Room not found'); return; }
    
    // ✅ Use authenticated user if available
    const userId = socket.user?._id?.toString();
    const verifiedName = socket.user 
      ? `${socket.user.firstName} ${socket.user.lastName}`.trim()
      : playerName;
    
    if (!userId) {
      socket.emit('join-error', 'Authentication required');
      return;
    }
    
    // Verify student is allowed to join this session
    if (socket.user.role !== 'student' && socket.user.role !== 'teacher') {
      socket.emit('join-error', 'Only students can join games');
      return;
    }
    
    // Add/update player
    const existing = room.players.find(p => p.userId === userId);
    if (!existing) {
      room.players.push({ id: socket.id, userId, name: verifiedName });
    } else {
      existing.id = socket.id;
    }
    
    socket.join(roomCode);
    // ... rest of handler
  } catch (e) {
    console.error('join-game error:', e);
    socket.emit('join-error', 'Failed to join game');
  }
});
```

#### Step 4: Update Client SocketContext
```jsx
// client/src/context/SocketContext.jsx
useEffect(() => {
  if (!user) {
    // ...existing cleanup
    return;
  }

  const newSocket = io(backendUrl, {
    path: '/socket.io/',
    transports: ['websocket'],
    auth: {
      token: user.token  // ✅ Send JWT token
    }
  });
  // ...
}, [user]);
```

### Testing Procedure

#### Pre-Fix Test (Reproduce Bug)
```javascript
// In browser console without logging in
const socket = io('http://localhost:5000');
socket.emit('join-game', { 
  roomCode: 'ABCD12', 
  playerName: 'Hacker', 
  userId: 'fakeUserId123' 
});
// BUG: Can join with fake userId
```

#### Post-Fix Test
```javascript
// Without token
const socket = io('http://localhost:5000');
socket.emit('join-game', { roomCode: 'ABCD12', playerName: 'Test' });
socket.on('join-error', (msg) => console.log(msg));
// Expected: "Authentication required"

// With valid student token
const socket = io('http://localhost:5000', {
  auth: { token: validStudentToken }
});
socket.emit('join-game', { roomCode: 'ABCD12' });
// Expected: Successfully joins with verified name
```

---

## BUG-006: Memory Leak in liveGames

### Problem
`liveGames` object in `server/realtimeState.js` never cleans up abandoned game rooms.

### Current Code
```javascript
// server/realtimeState.js
const liveGames = {};  // ❌ Grows indefinitely

// socketHandler.js - only deleted on explicit 'end-game'
socket.on('end-game', async (roomCode) => {
  // ...
  delete liveGames[roomCode];
});
```

### Fix

#### Step 1: Add Cleanup Service
```javascript
// server/services/liveGameCleanup.js
const { liveGames } = require('../realtimeState');
const LiveSession = require('../models/LiveSession');

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;  // Run every 5 minutes

async function cleanupStaleGames() {
  const now = Date.now();
  const staleCodes = [];
  
  for (const [code, room] of Object.entries(liveGames)) {
    // Check if room is stale (no activity)
    const lastActivity = room.lastActivityAt || room.createdAt || 0;
    if (now - lastActivity > STALE_THRESHOLD_MS) {
      staleCodes.push(code);
      
      // Update database session if exists
      if (room.sessionId) {
        try {
          await LiveSession.findByIdAndUpdate(room.sessionId, {
            status: 'ended',
            endedAt: new Date(),
            endReason: 'stale_cleanup'
          });
        } catch (e) {
          console.error('Failed to update stale session:', e);
        }
      }
    }
  }
  
  // Remove stale rooms
  for (const code of staleCodes) {
    console.log(`[cleanup] Removing stale game room: ${code}`);
    delete liveGames[code];
  }
  
  if (staleCodes.length > 0) {
    console.log(`[cleanup] Removed ${staleCodes.length} stale game rooms`);
  }
}

function startCleanupInterval() {
  setInterval(cleanupStaleGames, CLEANUP_INTERVAL_MS);
  console.log('✅ Live game cleanup service started');
}

module.exports = { cleanupStaleGames, startCleanupInterval };
```

#### Step 2: Add Activity Tracking
```javascript
// socketHandler.js - Add to each event handler
socket.on('join-game', async ({ roomCode, ... }) => {
  const room = liveGames[roomCode];
  if (room) {
    room.lastActivityAt = Date.now();  // ✅ Track activity
  }
  // ...
});

socket.on('live:answer', async ({ roomCode, ... }) => {
  const room = liveGames[roomCode];
  if (room) {
    room.lastActivityAt = Date.now();
  }
  // ...
});
```

#### Step 3: Initialize in server.js
```javascript
const { startCleanupInterval } = require('./services/liveGameCleanup');

// After server starts
startCleanupInterval();
```

### Testing Procedure

#### Test Cleanup
```bash
# 1. Create a game room and abandon it
# 2. Wait 30+ minutes (or temporarily reduce threshold to 1 minute for testing)
# 3. Check server logs
pm2 logs madrassaplay-api --lines 50 | grep cleanup
# Expected: "[cleanup] Removing stale game room: XXXXX"

# 4. Verify memory doesn't grow
# Monitor memory before and after heavy usage
pm2 monit
```

---

## BUG-007: Double Password Hashing

### Problem
Password is hashed in `userController.js` and again in `User.js` pre-save hook.

### Current Code

**userController.js (Lines 50-55)**
```javascript
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
const user = await User.create({
  password: hashedPassword,  // Already hashed
  // ...
});
```

**User.js pre-save hook (Lines 180-190)**
```javascript
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // This check exists but may not catch all cases:
  if (typeof this.password === 'string' && this.password.startsWith('$2') && this.password.length >= 60) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);  // Hashes again!
  next();
});
```

### Fix
Remove hashing from controller - let the model handle it consistently.

**userController.js**
```javascript
// REMOVE these lines:
// const salt = await bcrypt.genSalt(10);
// const hashedPassword = await bcrypt.hash(password, salt);

const user = await User.create({
  password: password,  // ✅ Plain text - model will hash
  // ...
});
```

**Also update: createManagerForSchool in schoolController.js**
```javascript
// REMOVE:
// const hashedPassword = await bcrypt.hash(password, 10);

const manager = await User.create({
  password: password,  // ✅ Plain text - model will hash
  // ...
});
```

### Testing Procedure

#### Post-Fix Test
```bash
# 1. Create a new user
curl -s -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"mypassword123","role":"student"}'

# 2. Login with that user
curl -s -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"mypassword123"}'
# Expected: Returns token (login successful)

# 3. Verify in database - password should be single bcrypt hash
mongo
> use madrassaplay
> db.users.findOne({email:"test@example.com"}).password
# Expected: Single bcrypt hash starting with $2a$ or $2b$, length ~60 chars
```

---

## BUG-008: Race Condition Payment/Balance

### Problem
Payment creation and balance update are not atomic - concurrent payments can cause incorrect balances.

### Current Code (paymentController.js Lines 140-175)
```javascript
const payment = await Payment.create(paymentPayload);  // Step 1

// ... calculate sessionsAdded ...

if (Number.isFinite(sessionsAdded) && sessionsAdded !== 0) {
  await Enrollment.updateOne(  // Step 2 - Not atomic with Step 1
    { _id: enrollmentId },
    { $inc: { balance: sessionsAdded } }
  );
}
```

### Fix
Use MongoDB transactions:

```javascript
const createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { enrollmentId, amount, kind, ... } = req.body || {};
    // ... validation ...

    const enrollment = await Enrollment.findById(enrollmentId).session(session);
    if (!enrollment || enrollment.schoolId.toString() !== schoolId.toString()) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Enrollment not found.' });
    }

    // Create payment within transaction
    const [payment] = await Payment.create([paymentPayload], { session });

    // Calculate sessions
    let sessionsAdded = /* ... calculation ... */;

    // Update balance within same transaction
    if (Number.isFinite(sessionsAdded) && sessionsAdded !== 0) {
      await Enrollment.updateOne(
        { _id: enrollmentId },
        { $inc: { balance: sessionsAdded } },
        { session }
      );
    }

    // Update debt within same transaction
    if (typeof payment.debtDelta === 'number') {
      await StudentFinancial.updateOne(
        { schoolId, studentId: enrollment.studentId },
        { $inc: { debt: payment.debtDelta } },
        { upsert: true, session }
      );
    }

    await session.commitTransaction();
    res.status(201).json({ payment, balanceDelta: sessionsAdded });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('createPayment error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  } finally {
    session.endSession();
  }
};
```

### Testing Procedure

#### Pre-Fix Test (Reproduce Race Condition)
```javascript
// Concurrent payment test script
const axios = require('axios');

async function testRaceCondition() {
  const enrollmentId = '...';
  const token = '...';
  
  // Get initial balance
  const before = await axios.get(`/api/enrollments/${enrollmentId}/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Initial balance:', before.data.balance);
  
  // Send 10 concurrent payments
  const payments = Array(10).fill().map(() => 
    axios.post('/api/payments', {
      enrollmentId,
      amount: 100,
      kind: 'pay_sessions',
      units: 1,
      unitType: 'session'
    }, { headers: { Authorization: `Bearer ${token}` } })
  );
  
  await Promise.all(payments);
  
  // Get final balance
  const after = await axios.get(`/api/enrollments/${enrollmentId}/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Final balance:', after.data.balance);
  console.log('Expected: +10, Actual:', after.data.balance - before.data.balance);
}
```

#### Post-Fix Test
```bash
# Same test as above - balance should increase by exactly 10
# Run multiple times to verify consistency
```

---

## BUG-009: Floating Point Session Calculations

### Problem
Session calculations can result in floating point errors (e.g., 0.30000000000000004).

### Current Code
```javascript
sessionsAdded = (paid / snap.cyclePrice) * snap.cycleSize;
// May produce: 2.9999999999999996 instead of 3
```

### Fix
```javascript
// Helper function for safe session calculation
function calculateSessions(amount, snapshot) {
  if (!snapshot || typeof amount !== 'number') return 0;
  
  let sessions = 0;
  
  if (snapshot.paymentModel === 'per_session') {
    if (typeof snapshot.sessionPrice === 'number' && snapshot.sessionPrice > 0) {
      sessions = amount / snapshot.sessionPrice;
    }
  } else if (snapshot.paymentModel === 'per_cycle') {
    if (typeof snapshot.cyclePrice === 'number' && snapshot.cyclePrice > 0 &&
        typeof snapshot.cycleSize === 'number' && snapshot.cycleSize > 0) {
      sessions = (amount / snapshot.cyclePrice) * snapshot.cycleSize;
    }
  }
  
  // Round to 2 decimal places to avoid floating point errors
  // Use Math.round with multiplier for precision
  return Math.round(sessions * 100) / 100;
}

// Usage
sessionsAdded = calculateSessions(paid, snap);
```

### Testing Procedure

```javascript
// Test cases
console.log(calculateSessions(300, { paymentModel: 'per_session', sessionPrice: 100 }));
// Expected: 3

console.log(calculateSessions(300, { paymentModel: 'per_cycle', cyclePrice: 300, cycleSize: 4 }));
// Expected: 4

console.log(calculateSessions(100, { paymentModel: 'per_cycle', cyclePrice: 300, cycleSize: 4 }));
// Expected: 1.33 (not 1.3333333333333333)
```

---

## BUG-010: Token Expiration Not Checked on Load

### Problem
Client loads user from localStorage without checking if token is expired.

### Current Code (AuthContext.jsx)
```javascript
useEffect(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    setUser(userData);  // ❌ No expiration check
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  }
  setLoading(false);
}, []);
```

### Fix
```javascript
import { jwtDecode } from 'jwt-decode';

useEffect(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      
      // Check token expiration
      const decoded = jwtDecode(userData.token);
      const now = Date.now() / 1000;
      
      if (decoded.exp && decoded.exp < now) {
        // Token expired - clear storage
        console.log('Token expired, logging out');
        localStorage.removeItem('user');
        setUser(null);
      } else {
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        
        // Set up auto-logout before expiration
        const timeUntilExpiry = (decoded.exp - now) * 1000;
        if (timeUntilExpiry > 0 && timeUntilExpiry < 86400000) { // Less than 24h
          setTimeout(() => {
            console.log('Token expiring, logging out');
            logout();
          }, timeUntilExpiry);
        }
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e);
      localStorage.removeItem('user');
    }
  }
  setLoading(false);
}, []);
```

### Testing Procedure

```javascript
// 1. Create an expired token manually
const expiredToken = jwt.sign({ id: 'testuser' }, 'secret', { expiresIn: '-1h' });

// 2. Store in localStorage
localStorage.setItem('user', JSON.stringify({ token: expiredToken, role: 'student' }));

// 3. Reload page
location.reload();

// 4. Check user state
// Expected: User is null, redirected to login
```

---

## BUG-011: Hardcoded Socket URL

### Problem
Production socket URL is hardcoded as `wajibet.com` in `SocketContext.jsx`.

### Current Code
```javascript
const backendUrl = process.env.NODE_ENV === 'production'
  ? 'https://wajibet.com'  // ❌ Hardcoded
  : 'http://localhost:5000';
```

### Fix
```javascript
const backendUrl = process.env.NODE_ENV === 'production'
  ? (import.meta.env.VITE_SOCKET_URL || window.location.origin)
  : 'http://localhost:5000';
```

Also add to `.env.production`:
```
VITE_SOCKET_URL=https://your-production-domain.com
```

### Testing Procedure

```bash
# 1. Build with correct env
VITE_SOCKET_URL=https://api.madrassaplay.com npm run build

# 2. Check built output
grep -r "wajibet" dist/
# Expected: No matches

# 3. Test socket connection in production
# Open browser console, check socket connects to correct URL
```

---

## BUG-012: Username Global Uniqueness

### Problem
Username uniqueness is enforced globally instead of per-school.

### Current Code (User.js)
```javascript
username: { type: String, trim: true },  // No uniqueness constraint
```

But in studentController.js:
```javascript
const usernameExists = await User.findOne({ username });  // ❌ Global check
if (usernameExists) {
  throw new Error('Username already taken');
}
```

### Fix

#### Option A: Per-School Unique Index
```javascript
// User.js - Add compound index
userSchema.index(
  { school: 1, username: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      username: { $type: 'string', $ne: '' } 
    } 
  }
);
```

#### Option B: Update Controller Check
```javascript
// studentController.js
const usernameExists = await User.findOne({ 
  username, 
  school: schoolId  // ✅ Per-school check
});
if (usernameExists) {
  throw new Error('Username already taken in this school');
}
```

### Testing Procedure

```bash
# 1. Create student in School A
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer $MANAGER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","username":"johndoe","password":"pass123"}'

# 2. Create student with same username in School B
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer $MANAGER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Smith","username":"johndoe","password":"pass123"}'
# Expected: Success (different school)

# 3. Create another student with same username in School A
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer $MANAGER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jim","lastName":"Brown","username":"johndoe","password":"pass123"}'
# Expected: {"message":"Username already taken in this school"}
```

---

## Post-Fix Checklist

After fixing all bugs:

- [ ] Run full test suite: `cd server && npm test`
- [ ] Check for console errors in browser
- [ ] Test login/logout flow
- [ ] Test payment creation flow
- [ ] Test live game session
- [ ] Monitor server logs for 24h: `pm2 logs madrassaplay-api`
- [ ] Check memory usage: `pm2 monit`
- [ ] Verify no "headers already sent" errors
- [ ] Security scan with OWASP ZAP or similar

---

## Rollback Plan

If any fix causes issues:

1. **Git revert**: `git revert <commit-hash>`
2. **Rebuild**: `cd client && npm run build`
3. **Restart**: `pm2 restart madrassaplay-api`

Keep database backups before applying fixes:
```bash
mongodump --uri="$MONGO_URI" --out=/backup/pre-bugfix-$(date +%Y%m%d)
```

---

*Document Version: 1.0*
*Created: January 22, 2026*
