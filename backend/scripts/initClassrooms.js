const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Classroom = require('../models/Classroom');

// Make sure MongoDB URI exists
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected for classroom initialization');
    try {
      await initializeClassrooms();
      console.log('Initialization complete');
      process.exit(0);
    } catch (error) {
      console.error('Initialization failed:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const initializeClassrooms = async () => {
  try {
    // Clear existing classrooms
    await Classroom.deleteMany({});
    console.log('Cleared existing classrooms');

    const classrooms = [];
    
    // Create NC rooms (smaller capacity)
    for (let floor = 1; floor <= 3; floor++) {
      for (let room = 1; room <= 20; room++) {
        // Format room numbers as NC101, NC102, etc.
        const roomNumber = `NC${floor}${room.toString().padStart(2, '0')}`;
        classrooms.push({
          roomNumber,
          type: 'NC',
          capacity: Math.floor(Math.random() * 40) + 60, // 60-99 capacity
          floor,
          features: {
            hasProjector: true,
            hasComputers: false,
            hasAC: true
          },
          isAvailable: true
        });
      }
    }
    
    // Create NR rooms (larger capacity)
    for (let floor = 1; floor <= 3; floor++) {
      for (let room = 1; room <= 20; room++) {
        // Format room numbers as NR101, NR102, etc.
        const roomNumber = `NR${floor}${room.toString().padStart(2, '0')}`;
        classrooms.push({
          roomNumber,
          type: 'NR',
          capacity: Math.floor(Math.random() * 100) + 100, // 100-199 capacity
          floor,
          features: {
            hasProjector: true,
            hasComputers: false,
            hasAC: true
          },
          isAvailable: true
        });
      }
    }
    
    // Create department labs with sequential numbers 101-110
    const departments = [
      { id: 'cs', name: 'CS' },
      { id: 'ee', name: 'EE' },
      { id: 'me', name: 'ME' },
      { id: 'ce', name: 'CE' },
      { id: 'mnc', name: 'MNC' }
    ];

    departments.forEach(dept => {
      // Create labs 101-110 for each department
      for (let i = 1; i <= 10; i++) {
        const labNumber = 100 + i;
        const roomNumber = `${dept.name}-${labNumber}`; // Format: CS-101, EE-101, etc.
        classrooms.push({
          roomNumber,
          type: 'LAB',
          capacity: Math.floor(Math.random() * 30) + 30, // 30-59 capacity
          department: dept.id,
          floor: Math.ceil(labNumber / 100), // Floor based on first digit
          features: {
            hasProjector: true,
            hasComputers: true,
            hasAC: true
          },
          isAvailable: true
        });
      }
    });

    // Insert all classrooms and shuffle them first
    const shuffledClassrooms = shuffleArray(classrooms);
    const result = await Classroom.insertMany(shuffledClassrooms);
    
    console.log(`Successfully created ${result.length} classrooms`);
    console.log('Sample rooms created:');
    console.log('NC rooms:', result.filter(r => r.type === 'NC').slice(0, 3).map(r => r.roomNumber));
    console.log('NR rooms:', result.filter(r => r.type === 'NR').slice(0, 3).map(r => r.roomNumber));
    console.log('LAB rooms:', result.filter(r => r.type === 'LAB').slice(0, 3).map(r => r.roomNumber));
    
  } catch (error) {
    console.error('Error initializing classrooms:', error);
  }
};

// Add shuffle function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
