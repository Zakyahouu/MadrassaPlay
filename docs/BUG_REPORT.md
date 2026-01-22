# MadrassaPlay Bug Report

> Generated: January 22, 2026
> Scope: Deep analysis of server and client code for bugs, security issues, and potential problems

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 4 |
| 🟡 Medium | 6 |
| 🔵 Low | 5 |

---

## 🔴 Critical Issues

### BUG-001: Authentication Middleware - Missing Return Statement
**File:** `server/middleware/authMiddleware.js`
**Lines:** 5-28

**Description:**
The `protect` middleware has a missing `return` statement after handling valid tokens, causing the "no token" response to be sent even after successful authentication.

**Current Code:**
```javascript
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').populate('school');
      next(); // ✅ Calls next, but doesn't return!
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
      // ❌ Missing return here too
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' }); // ❌ This runs even after next()!
  }
};
```

**Impact:**
- After successful authentication, Express continues to the next middleware/controller
- BUT then the code continues and sends a 401 response
- This causes "Headers already sent" errors and unpredictable behavior

**Fix:**
```javascript
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').populate('school');
      return next(); // ✅ Add return
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' }); // ✅ Add return
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' }); // ✅ Add return
  }
};
```

---

### BUG-002: Payment Update - No Authorization Check
**File:** `server/controllers/paymentController.js`
**Lines:** 295-307

**Description:**
The `updatePayment` and `deletePayment` functions do not verify that the payment belongs to the user's school, allowing cross-tenant data modification.

**Current Code:**
```javascript
const updatePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const updates = req.body;
    const payment = await Payment.findByIdAndUpdate(paymentId, updates, { new: true });
    // ❌ No school ownership check!
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
```

**Impact:**
- A manager from School A can update/delete payments from School B
- Serious multi-tenancy security vulnerability
- Financial data integrity at risk

**Fix:**
```javascript
const updatePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const schoolId = req.user.school?._id || req.user.school;
    
    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID.' });
    }
    
    const payment = await Payment.findOne({ _id: paymentId, schoolId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    
    // Apply allowed updates only
    const allowedUpdates = ['note', 'status']; // Define allowed fields
    const updates = req.body;
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) payment[field] = updates[field];
    });
    
    await payment.save();
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
```

---

## 🟠 High Severity Issues

### BUG-003: Finance Controller - School Authorization Commented Out
**File:** `server/controllers/financeController.js`
**Lines:** 32-36, 83-87, etc.

**Description:**
School authorization checks are commented out with "TEMPORARILY DISABLED FOR TESTING" comments, but are in production code.

```javascript
// Check if user has access to this school - TEMPORARILY DISABLED FOR TESTING
const userSchoolId = req.user.school?._id?.toString() || req.user.school?.toString();

// if (!userSchoolId || userSchoolId !== schoolId) {
//   return res.status(403).json({ message: 'Access denied to this school' });
// }
```

**Impact:**
- Any manager can access financial data from any school
- Complete bypass of multi-tenancy isolation for finance

**Fix:** Uncomment the authorization checks immediately.

---

### BUG-004: getPaymentById - No Authorization Check
**File:** `server/controllers/paymentController.js`
**Lines:** 211-234

**Description:**
The authorization check is commented out, allowing any authenticated user to view any payment.

```javascript
// Authorization check (optional, depending on requirements)
// const schoolIdRaw = (req.user?.school && (req.user.school._id || req.user.school)) || null;
// if (payment.schoolId.toString() !== schoolIdRaw?.toString()) {
//   return res.status(403).json({ message: 'Not authorized to view this payment.' });
// }
```

**Impact:**
- Students/teachers can view payment details from other schools
- Privacy and security violation

---

### BUG-005: Socket.IO - No Authentication for Live Games
**File:** `server/socket/socketHandler.js`

**Description:**
Socket events don't verify that the user is authenticated or authorized to join/host games. Any client with a valid room code can join.

**Current Code:**
```javascript
socket.on('join-game', async ({ roomCode, playerName, userId } = {}) => {
  // ❌ No verification that userId matches an authenticated user
  // ❌ No check that user is enrolled in the session's classes
});
```

**Impact:**
- Unauthenticated users could potentially join games
- Users from other schools could join sessions if they obtain the room code

**Fix:** Implement socket authentication middleware or verify user identity on each event.

---

### BUG-006: Socket.IO - Memory Leak in liveGames
**File:** `server/socket/socketHandler.js` & `server/realtimeState.js`

**Description:**
If a game session ends but `delete liveGames[roomCode]` fails silently (in try/catch), or if the host disconnects without ending the game, the room persists forever.

```javascript
socket.on('end-game', async (roomCode) => {
  try {
    // ...
    try { delete liveGames[roomCode]; } catch {} // ❌ Silent failure
  } catch (e) { console.error('end-game handler failed', e); }
});
```

**Impact:**
- Memory grows over time as abandoned games accumulate
- Eventually causes server performance degradation

**Fix:** 
1. Add periodic cleanup of stale games (e.g., games older than 24 hours)
2. Log deletion failures instead of silently catching

---

## 🟡 Medium Severity Issues

### BUG-007: Double Password Hashing Risk
**File:** `server/models/User.js`

**Description:**
The User model has a `pre('save')` hook that hashes passwords, but `createStudent` and `createManagerForSchool` controllers also manually hash before creating.

**Risk:**
- If someone modifies the controller to not hash, they might expect the model to do it
- Inconsistent behavior could lead to bugs

**Recommendation:** Consolidate password hashing in ONE place (preferably the model hook).

---

### BUG-008: Race Condition in Payment Balance Update
**File:** `server/controllers/paymentController.js`
**Lines:** 144-161

**Description:**
Payment creation and enrollment balance update are not atomic:

```javascript
const payment = await Payment.create(paymentPayload);

// Later...
if (Number.isFinite(sessionsAdded) && sessionsAdded !== 0) {
  await Enrollment.updateOne(
    { _id: enrollmentId },
    { $inc: { balance: sessionsAdded } }
  );
}
```

**Impact:**
- If the balance update fails after payment is created, the payment exists but balance wasn't credited
- No transaction/rollback mechanism

**Fix:** Use MongoDB transactions:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  const payment = await Payment.create([paymentPayload], { session });
  await Enrollment.updateOne({ _id: enrollmentId }, { $inc: { balance: sessionsAdded } }, { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

### BUG-009: Floating Point Session Calculations
**File:** `server/controllers/paymentController.js`

**Description:**
Session calculations use division which can produce floating point numbers:

```javascript
sessionsAdded = (Number.isFinite(paid) ? paid : parsedAmount) / snap.sessionPrice;
```

**Impact:**
- Enrollments can have fractional session balances like `2.3333333`
- This may cause unexpected behavior in attendance tracking

**Fix:** Round to appropriate precision:
```javascript
sessionsAdded = Math.round(paid / snap.sessionPrice);
// OR for fractional support:
sessionsAdded = parseFloat((paid / snap.sessionPrice).toFixed(2));
```

---

### BUG-010: Client localStorage Token Persistence
**File:** `client/src/context/AuthContext.jsx`

**Description:**
Tokens are stored in localStorage without expiration checking on the client side. The 30-day JWT expiration is only checked server-side.

**Impact:**
- User appears logged in but gets 401 errors on all requests
- Poor UX - should auto-logout when token expires

**Fix:** Add token expiration check on app load:
```javascript
useEffect(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(userData.token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }
    } catch (e) {
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  }
  setLoading(false);
}, []);
```

---

### BUG-011: SocketContext - Hardcoded Production URL
**File:** `client/src/context/SocketContext.jsx`

**Description:**
Production socket URL is hardcoded to `wajibet.com`:

```javascript
const backendUrl = process.env.NODE_ENV === 'production'
  ? 'https://wajibet.com'  // ❌ Hardcoded wrong domain?
  : 'http://localhost:5000';
```

**Impact:**
- Socket connections will fail in production if deployed to different domain
- Users reported this as an issue

**Fix:** Use environment variable or derive from `window.location`:
```javascript
const backendUrl = process.env.NODE_ENV === 'production'
  ? `${window.location.protocol}//${window.location.host}`
  : 'http://localhost:5000';
```

---

### BUG-012: Username Uniqueness - Global Not Per-School
**File:** `server/models/User.js`

**Description:**
The `username` field has no uniqueness constraint in the schema. But `createStudent` checks for global uniqueness:

```javascript
const usernameExists = await User.findOne({ username });
if (usernameExists) {
  throw new Error('Username already taken');
}
```

**Impact:**
- A student from School A cannot use the same username as School B
- For a multi-tenant system, usernames should be unique per-school

**Fix:** Add compound index and change check:
```javascript
// In schema:
userSchema.index({ school: 1, username: 1 }, { unique: true, sparse: true });

// In controller:
const usernameExists = await User.findOne({ username, school: schoolId });
```

---

## 🔵 Low Severity Issues

### BUG-013: Console.log Statements in Production
**Files:** Multiple controllers

**Description:**
Debug console.log statements remain in production code:

```javascript
console.log('Looking for employee with userId:', req.user._id);
console.log('Found employee:', employee ? 'Yes' : 'No');
console.log(`Checking ${section} permission for employee:`, employee.permissions);
```

**Impact:**
- Log pollution
- Slight performance overhead
- Potential information leakage in logs

**Fix:** Use a proper logging library with log levels (winston, pino).

---

### BUG-014: Missing Input Validation on educationLevel
**File:** `server/models/User.js`

**Description:**
The `educationLevel` enum includes a typo: `'universitie'` (should be `'university'`).

```javascript
educationLevel: { 
  type: String, 
  enum: {
    values: ['before_education', 'primary', 'middle', 'high_school', 'university', 'universitie', 'other'],
  },
},
```

**Impact:** Minor - keeps legacy typo for backward compatibility, but confusing.

**Fix:** Remove `'universitie'` after migrating any existing data.

---

### BUG-015: Unused Mongoose Require Inside Functions
**File:** `server/controllers/studentController.js`

**Description:**
Mongoose and Enrollment are re-required inside functions despite being imported at the top:

```javascript
const getStudent = asyncHandler(async (req, res) => {
  // ...
  try {
    const mongoose = require('mongoose'); // ❌ Already imported at top
    const Enrollment = require('../models/Enrollment'); // ❌ Already imported at top
```

**Impact:** Minor performance overhead from repeated requires (though Node caches).

**Fix:** Remove the redundant requires.

---

### BUG-016: Empty Model Files
**Files:** `server/models/Badge.js`, `server/models/EarnedBadge.js`, `server/models/SharedModel.js`

**Description:**
These model files exist but are empty (0 bytes).

**Impact:**
- Confusion about which models are in use
- `require()` will fail if these are imported anywhere

**Fix:** Either implement the models or delete the files.

---

### BUG-017: Inconsistent Error Response Format
**Files:** Various controllers

**Description:**
Some endpoints return `{ message: '...' }`, others return `{ success: false, message: '...' }`, others return `{ error: '...' }`.

**Examples:**
```javascript
// Style 1
res.status(400).json({ message: 'Invalid request' });

// Style 2
res.status(400).json({ success: false, message: 'Invalid request' });

// Style 3
res.status(500).json({ message: 'Server Error', error: error.message });
```

**Impact:**
- Frontend needs to handle multiple error formats
- Inconsistent user experience

**Fix:** Standardize error response format across all endpoints.

---

## Recommendations

### Immediate Actions (Do Now)
1. ✅ Fix BUG-001 - Auth middleware return statements
2. ✅ Fix BUG-002 - Payment controller authorization
3. ✅ Fix BUG-003 - Uncomment finance authorization checks
4. ✅ Fix BUG-004 - Add payment view authorization

### Short-term Actions (This Week)
1. Add socket authentication (BUG-005)
2. Implement liveGames cleanup (BUG-006)
3. Add MongoDB transactions for payments (BUG-008)
4. Fix hardcoded socket URL (BUG-011)

### Long-term Actions (This Month)
1. Implement proper logging system
2. Standardize error response format
3. Add comprehensive input validation
4. Review all multi-tenancy boundaries

---

*Report generated by code analysis on January 22, 2026*
