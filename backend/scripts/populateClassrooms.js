const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schedulr';

console.log(`Connecting to MongoDB to populate classroom data...`);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Define Classroom Schema
  const ClassroomSchema = new mongoose.Schema({
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['NC', 'NR', 'LAB'],
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    department: {
      type: String,
      trim: true
    },
    floor: {
      type: Number,
      required: true
    },
    features: {
      hasProjector: {
        type: Boolean,
        default: false
      },
      hasComputers: {
        type: Boolean,
        default: false
      },
      hasAC: {
        type: Boolean,
        default: false
      }
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  });
  
  // Create or get Classroom model
  const Classroom = mongoose.models.Classroom || mongoose.model('Classroom', ClassroomSchema);
  
  try {
    // Check if classrooms already exist
    const count = await Classroom.countDocuments();
    
    if (count > 0) {
      console.log(`✅ ${count} classrooms already exist in the database`);
    } else {
      // Define default classrooms
      // 20 regular classrooms (NC)
      const regularClassrooms = Array.from({ length: 20 }, (_, i) => ({
        roomNumber: `NC${(i + 101).toString().padStart(3, '0')}`,
        type: 'NC',
        capacity: 40 + Math.floor(Math.random() * 40), // Capacities between 40-80
        floor: Math.floor(i / 7) + 1, // Distribute across floors
        features: {
          hasProjector: Math.random() > 0.2, // 80% have projectors
          hasComputers: false,
          hasAC: Math.random() > 0.3 // 70% have AC
        },
        isAvailable: true
      }));
      
      // 20 large lecture halls (NR)
      const lectureHalls = Array.from({ length: 20 }, (_, i) => ({
        roomNumber: `NR${(i + 101).toString().padStart(3, '0')}`,
        type: 'NR',
        capacity: 100 + Math.floor(Math.random() * 100), // Capacities between 100-200
        floor: Math.floor(i / 5) + 1, // Distribute across floors
        features: {
          hasProjector: true, // All lecture halls have projectors
          hasComputers: false,
          hasAC: true // All lecture halls have AC
        },
        isAvailable: true
      }));
      
      // Define departments
      const departments = ['cs', 'ee', 'me', 'ce', 'mnc'];
      
      // 5 lab rooms for each department
      const labRooms = departments.flatMap(dept => 
        Array.from({ length: 5 }, (_, i) => ({
          roomNumber: `${dept.toUpperCase()}-${(i + 101).toString().padStart(3, '0')}`,
          type: 'LAB',
          capacity: 25 + Math.floor(Math.random() * 25), // Capacities between 25-50
          department: dept,
          floor: Math.floor(Math.random() * 3) + 1, // Random floor between 1-3
          features: {
            hasProjector: Math.random() > 0.1, // 90% have projectors
            hasComputers: true, // All labs have computers
            hasAC: Math.random() > 0.2 // 80% have AC
          },
          isAvailable: true
        }))
      );
      
      // Combine all room types
      const allClassrooms = [...regularClassrooms, ...lectureHalls, ...labRooms];
      
      // Insert all classrooms
      await Classroom.insertMany(allClassrooms);
      console.log(`✅ Successfully created ${allClassrooms.length} classrooms:`);
      console.log(`   - ${regularClassrooms.length} regular classrooms (NC)`);
      console.log(`   - ${lectureHalls.length} lecture halls (NR)`);
      console.log(`   - ${labRooms.length} lab rooms across ${departments.length} departments`);
    }
  } catch (error) {
    console.error('❌ Error populating classrooms:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
})
.catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1);
});
