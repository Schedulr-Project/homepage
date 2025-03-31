const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const courseRoutes = require('./routes/courseRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const classroomRoutes = require('./routes/classroomRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('MONGODB_URI not defined in environment variables');
  process.exit(1);
}

// Improved MongoDB connection with better error handling and options
const connectWithRetry = () => {
  console.log('MongoDB connection with retry');
  return mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Timeout for server selection
    socketTimeoutMS: 45000, // Socket timeout
    connectTimeoutMS: 30000, // Connection timeout
  });
};

// Initial connection
connectWithRetry()
  .then(() => {
    console.log('MongoDB Atlas connected successfully');
    console.log(`Database name: ${mongoose.connection.db.databaseName}`);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Will retry connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });

// Handle connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error after initial connection:', err);
  console.log('Attempting to reconnect...');
  setTimeout(connectWithRetry, 5000);
});

// Handle disconnections
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...');
  setTimeout(connectWithRetry, 5000);
});

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/classrooms', classroomRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Schedulr API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
