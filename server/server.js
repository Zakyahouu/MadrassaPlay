// server/server.js

// 1. IMPORT PACKAGES
// ==============================================================================
const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
// Import route files
const userRoutes = require('./routes/userRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const gameTemplateRoutes = require('./routes/gameTemplateRoutes');
const gameCreationRoutes = require('./routes/gameCreationRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const gameResultRoutes = require('./routes/gameResultRoutes'); // NEW: Import game result routes


// 2. INITIALIZE THE APP
// ==============================================================================
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;


// 3. MIDDLEWARE
// ==============================================================================
app.use(express.json());


// 4. DEFINE ROUTES
// ==============================================================================
// Mount the routers
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/templates', gameTemplateRoutes);
app.use('/api/creations', gameCreationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/results', gameResultRoutes); // NEW: Mount game result routes


// 5. START THE SERVER
// ==============================================================================
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
