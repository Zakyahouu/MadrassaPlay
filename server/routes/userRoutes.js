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
const { registerUser, loginUser } = require('../controllers/userController');


// 4. DEFINE THE ROUTES
// ==============================================================================
// When a POST request is made to the root of this router ('/'), we call the registerUser function.
// We changed '/register' to just '/' because we will mount this whole file at '/api/users/register' later.
router.post('/register', registerUser);

// When a POST request is made to '/login', we will call the loginUser function.
router.post('/login', loginUser);


// 5. EXPORT THE ROUTER
// ==============================================================================
// We export the router so we can use it in our main server.js file.
module.exports = router;
