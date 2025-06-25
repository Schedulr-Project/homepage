const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Schedulr API server is running!',
    timestamp: new Date().toISOString()
  });
});

/**
 * Comprehensive health check - checks database connectivity and other services
 */
router.get('/status', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'OK',
    database: {
      status: 'unknown'
    }
  };

  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    health.database = {
      status: dbStatus[dbState] || 'unknown',
      state: dbState
    };

    if (dbState !== 1) {
      health.message = 'Database not connected';
      return res.status(503).json(health);
    }

    res.json(health);
  } catch (error) {
    health.message = error.message;
    health.error = true;
    res.status(503).json(health);
  }
});

/**
 * Test endpoint for checking registration flow
 */
router.post('/register-test', (req, res) => {
  console.log('Register test endpoint hit with body:', req.body);
  res.status(201).json({
    success: true,
    message: 'Test registration endpoint working!',
    receivedData: req.body
  });
});

module.exports = router;