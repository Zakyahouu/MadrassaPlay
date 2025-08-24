const express = require('express');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();
app.use(express.json());

app.use('/engines', express.static(path.join(__dirname, 'public', 'engines')));
// Serve uploaded media (icons/content assets)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/templates', require('./routes/gameTemplateRoutes'));
app.use('/api/creations', require('./routes/gameCreationRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/results', require('./routes/gameResultRoutes'));
app.use('/api/template-badges', require('./routes/templateBadgeRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/reporting', require('./routes/reportingRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

module.exports = app;
