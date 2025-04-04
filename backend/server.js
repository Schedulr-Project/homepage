const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courseRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const classroomRoutes = require('./routes/classroomRoutes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Configure CORS with more specific settings
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Add your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add a simple health check endpoint that doesn't require database access
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server with better logging
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Handle server startup errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose another port.`);
  } else {
    console.error('Server startup error:', error);
  }
  process.exit(1);
});

module.exports = app;
