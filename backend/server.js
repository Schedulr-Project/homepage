const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courseRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const classroomRoutes = require('./routes/classroomRoutes');


// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Logging middleware for all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS middleware - must come before routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS request');
    return res.sendStatus(200);
  }
  next();
});

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint (only used when not in production)
app.get('/', (req, res) => {
  // In production, this route will be overridden by the catch-all handler that serves React
  if (process.env.NODE_ENV !== 'production') {
    res.send('Schedulr API server is running!');
  } else {
    // In production, let the React app handle the root route
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  }
});

// Register health check routes
const healthCheckRoutes = require('./routes/health-check');
app.use('/api/health', healthCheckRoutes);

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend server is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Add logging middleware for requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Root health check endpoint that doesn't require database access
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Check MongoDB connection before initializing routes
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schedulr', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Add connection status endpoint
    app.get('/api/db-status', (req, res) => {
      res.status(200).json({
        connected: mongoose.connection.readyState === 1,
        dbName: mongoose.connection.db?.databaseName || 'unknown'
      });
    });
    
    // Only register routes after successful DB connection
    app.use('/api/auth', authRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/timetables', timetableRoutes);
    app.use('/api/classrooms', classroomRoutes);
    
    console.log('All routes registered successfully');

    // Serve React frontend in production
    if (process.env.NODE_ENV === 'production') {
      const buildPath = path.join(__dirname, '..', 'build');
      app.use(express.static(buildPath));

      // Catch-all: send index.html for any route not handled above
      app.get('*', (req, res, next) => {
        // Only serve index.html if the request is not for an API route
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(buildPath, 'index.html'));
        } else {
          // Pass API routes to the next middleware
          next();
        }
      });
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    
    // Add fallback routes for error reporting
    app.use('/api/auth', (req, res) => {
      res.status(503).json({ error: 'Database connection failed', details: err.message });
    });
    
    app.use('/api/*', (req, res) => {
      res.status(503).json({ error: 'Service unavailable due to database connection failure' });
    });
  });

// Create a test endpoint to verify the server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is working!' });
});

// Manual registration endpoint for testing
app.post('/api/auth/register-test', (req, res) => {
  console.log('Register test endpoint hit with body:', req.body);
  res.status(201).json({
    success: true,
    message: 'Test registration endpoint working!',
    receivedData: req.body
  });
});

// Test page route
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server - bind to all network interfaces instead of just localhost
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Test page available at http://localhost:${PORT}/test`);
});

// Handle server startup errors
app.on('error', function(error) {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose another port.`);
  } else {
    console.error('Server startup error:', error);
  }
  process.exit(1);
});

module.exports = app;
