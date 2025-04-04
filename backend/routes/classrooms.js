const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateUser, authorizeAdmin } = require('../middleware/auth');

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
}, { timestamps: true });

// Create Classroom Model if it doesn't exist already
const Classroom = mongoose.models.Classroom || mongoose.model('Classroom', ClassroomSchema);

// Create default classrooms if none exist
const createDefaultClassrooms = async () => {
  try {
    const count = await Classroom.countDocuments();
    
    if (count === 0) {
      const defaultClassrooms = [
        {
          roomNumber: 'NC101',
          type: 'NC',
          capacity: 60,
          floor: 1,
          features: { hasProjector: true, hasComputers: false, hasAC: true },
          isAvailable: true
        },
        {
          roomNumber: 'NC102',
          type: 'NC',
          capacity: 60,
          floor: 1,
          features: { hasProjector: true, hasComputers: false, hasAC: true },
          isAvailable: true
        },
        {
          roomNumber: 'NR201',
          type: 'NR',
          capacity: 150,
          floor: 2,
          features: { hasProjector: true, hasComputers: false, hasAC: true },
          isAvailable: true
        },
        {
          roomNumber: 'NR202',
          type: 'NR',
          capacity: 150,
          floor: 2,
          features: { hasProjector: true, hasComputers: false, hasAC: true },
          isAvailable: true
        },
        {
          roomNumber: 'CS-101',
          type: 'LAB',
          capacity: 30,
          department: 'cs',
          floor: 1,
          features: { hasProjector: true, hasComputers: true, hasAC: true },
          isAvailable: true
        },
        {
          roomNumber: 'EE-101',
          type: 'LAB',
          capacity: 30,
          department: 'ee',
          floor: 1,
          features: { hasProjector: true, hasComputers: true, hasAC: true },
          isAvailable: true
        }
      ];
      
      await Classroom.insertMany(defaultClassrooms);
      console.log('Default classrooms created');
    }
  } catch (error) {
    console.error('Error creating default classrooms:', error);
  }
};

// Create default classrooms on module load
createDefaultClassrooms();

// Get all classrooms
router.get('/', async (req, res) => {
  try {
    const classrooms = await Classroom.find({});
    res.status(200).json(classrooms);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classrooms',
      error: error.message
    });
  }
});

// Get classrooms by type (NC, NR, LAB)
router.get('/type/:type', async (req, res) => {
  try {
    const classrooms = await Classroom.find({ type: req.params.type });
    res.status(200).json(classrooms);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch classrooms of type ${req.params.type}`,
      error: error.message
    });
  }
});

// Get classrooms by department
router.get('/department/:department', async (req, res) => {
  try {
    const classrooms = await Classroom.find({ department: req.params.department });
    res.status(200).json(classrooms);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch classrooms for department ${req.params.department}`,
      error: error.message
    });
  }
});

// Get classroom by room number
router.get('/:roomNumber', async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ roomNumber: req.params.roomNumber });
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: `Classroom ${req.params.roomNumber} not found`
      });
    }
    
    res.status(200).json(classroom);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch classroom ${req.params.roomNumber}`,
      error: error.message
    });
  }
});

// Find free rooms for a specific day and time slot
router.get('/free', async (req, res) => {
  try {
    const { day, timeSlot } = req.query;
    
    if (!day || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Day and time slot are required'
      });
    }
    
    // Get all classrooms
    const allClassrooms = await Classroom.find({ isAvailable: true });
    
    // Get all timetables with slots matching the day and time
    const Timetable = mongoose.model('Timetable');
    const occupiedRooms = await Timetable.distinct('slots.roomNumber', {
      slots: {
        $elemMatch: {
          day: day,
          startTime: timeSlot
        }
      }
    });
    
    // Filter to find free rooms
    const freeRooms = allClassrooms.filter(room => !occupiedRooms.includes(room.roomNumber));
    
    // Group by type
    const groupedRooms = {
      NC: freeRooms.filter(room => room.type === 'NC'),
      NR: freeRooms.filter(room => room.type === 'NR'),
      LAB: freeRooms.filter(room => room.type === 'LAB')
    };
    
    res.status(200).json({
      success: true,
      day,
      timeSlot,
      totalFreeRooms: freeRooms.length,
      rooms: groupedRooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch free rooms',
      error: error.message
    });
  }
});

// Create new classroom - requires admin authentication
router.post('/', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { roomNumber, type, capacity, department, floor, features, isAvailable } = req.body;
    
    // Check if classroom with this room number already exists
    const existingRoom = await Classroom.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Classroom ${roomNumber} already exists`
      });
    }
    
    const classroom = await Classroom.create({
      roomNumber,
      type,
      capacity,
      department,
      floor,
      features,
      isAvailable
    });
    
    res.status(201).json({
      success: true,
      classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create classroom',
      error: error.message
    });
  }
});

// Update classroom - requires admin authentication
router.put('/:roomNumber', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const classroom = await Classroom.findOneAndUpdate(
      { roomNumber: req.params.roomNumber },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: `Classroom ${req.params.roomNumber} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      classroom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update classroom ${req.params.roomNumber}`,
      error: error.message
    });
  }
});

// Delete classroom - requires admin authentication
router.delete('/:roomNumber', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const classroom = await Classroom.findOneAndDelete({ roomNumber: req.params.roomNumber });
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: `Classroom ${req.params.roomNumber} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Classroom ${req.params.roomNumber} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to delete classroom ${req.params.roomNumber}`,
      error: error.message
    });
  }
});

module.exports = router;
