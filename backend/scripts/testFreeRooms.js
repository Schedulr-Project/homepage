const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Classroom = require('../models/Classroom');

const API_URL = 'http://localhost:5000/api';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // First check if classrooms exist directly in the database
      const classroomsCount = await Classroom.countDocuments({});
      console.log(`Found ${classroomsCount} classrooms in database`);
      
      if (classroomsCount === 0) {
        console.log('No classrooms found. Please run the initialization script first.');
        process.exit(1);
      }
      
      // Test the API endpoint directly
      console.log('Testing /classrooms/free API endpoint...');
      const response = await axios.get(`${API_URL}/classrooms/free`, {
        params: { day: 'Monday', timeSlot: '8 AM' }
      });
      
      console.log('API Response:');
      console.log('Status:', response.status);
      console.log('Total Free Rooms:', response.data.totalFreeRooms);
      console.log('NC Rooms:', response.data.rooms.NC.length);
      console.log('NR Rooms:', response.data.rooms.NR.length);
      console.log('LAB Rooms:', response.data.rooms.LAB.length);
      
      console.log('API test successful!');
    } catch (err) {
      console.error('Error testing free rooms API:', err);
      if (err.response) {
        console.error('API Error Response:', err.response.data);
      }
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
