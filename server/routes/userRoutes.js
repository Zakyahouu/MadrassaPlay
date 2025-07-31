// server/routes/userRoutes.js

// 1. IMPORT PACKAGES
// ==============================================================================
const express = require('express');

// 2. CREATE THE ROUTER
// ==============================================================================
// An Express Router is like a mini-app that can have its own routes.
// It helps us keep our routes organized in separate files.
const router = express.Router();

// 3. IMPORT CONTROLLER FUNCTIONS
// ==============================================================================
// We are now importing the functions from the controller file we created.
const { registerUser, loginUser, getCurrentUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// 4. DEFINE THE ROUTES
// ==============================================================================
router.post('/register', registerUser);
router.post('/login', loginUser);

// Make sure protect middleware is applied correctly
router.get('/me', protect, getCurrentUser);


// 5. EXPORT THE ROUTER
// ==============================================================================
// We export the router so we can use it in our main server.js file.
module.exports = router;
