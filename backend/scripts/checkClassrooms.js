const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Classroom = require('../models/Classroom');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Check if classrooms exist
      const classroomsCount = await Classroom.countDocuments({});
      console.log(`Found ${classroomsCount} classrooms in database`);
      
      if (classroomsCount === 0) {
        console.log('No classrooms found. You should run the initialization script:');
        console.log('  node scripts/initClassrooms.js');
      } else {
        // Display some sample classrooms
        const sampleRooms = await Classroom.find().limit(5);
        console.log('Sample classrooms:');
        sampleRooms.forEach(room => {
          console.log(`- ${room.roomNumber} (${room.type}): Capacity ${room.capacity}`);
        });
      }
    } catch (err) {
      console.error('Error checking classrooms:', err);
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
