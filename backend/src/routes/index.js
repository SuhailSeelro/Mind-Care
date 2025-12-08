const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('./auth');
const moodRoutes = require('./mood');
const forumRoutes = require('./forum');
const appointmentRoutes = require('./appointment');
const therapistRoutes = require('./therapist');
const adminRoutes = require('./admin');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MindCare API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API documentation
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MindCare Mental Health Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      mood: '/api/v1/mood',
      forum: '/api/v1/forum',
      appointments: '/api/v1/appointments',
      therapists: '/api/v1/therapists',
      admin: '/api/v1/admin'
    },
    documentation: 'https://docs.mindcare.com/api'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/mood', moodRoutes);
router.use('/forum', forumRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/therapists', therapistRoutes);
router.use('/admin', adminRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

module.exports = router;