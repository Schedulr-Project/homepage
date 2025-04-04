const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateUser, authorizeAdmin } = require('../middleware/auth');

// Define TimeSlot Schema (embedded in Timetable)
const TimeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  }
});

// Define Timetable Schema
const TimetableSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  slots: [TimeSlotSchema],
  semester: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Create Timetable Model if it doesn't exist already
const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);

// Get all timetables with populated course data
router.get('/', async (req, res) => {
  try {
    const timetables = await Timetable.find({}).populate('courseId');
    res.status(200).json(timetables);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetables',
      error: error.message
    });
  }
});

// Get timetables by department with populated course data
router.get('/department/:department', async (req, res) => {
  try {
    const department = req.params.department;
    let query = {};
    
    if (department !== 'all') {
      query.department = department;
    }
    
    const timetables = await Timetable.find(query).populate('courseId');
    res.status(200).json(timetables);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch timetables for department ${req.params.department}`,
      error: error.message
    });
  }
});

// Get timetable by course ID
router.get('/course/:courseId', async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ courseId: req.params.courseId }).populate('courseId');
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: `No timetable found for course ${req.params.courseId}`
      });
    }
    
    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch timetable for course ${req.params.courseId}`,
      error: error.message
    });
  }
});

// Create new timetable - requires authentication
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { courseId, slots, semester, year, department } = req.body;
    
    // Check if timetable for this course already exists
    const existingTimetable = await Timetable.findOne({ courseId });
    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message: `Timetable for course ID ${courseId} already exists`
      });
    }
    
    const timetable = await Timetable.create({
      courseId,
      slots,
      semester,
      year,
      department
    });
    
    res.status(201).json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create timetable',
      error: error.message
    });
  }
});

// Update timetable - requires authentication
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: `Timetable with ID ${req.params.id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update timetable ${req.params.id}`,
      error: error.message
    });
  }
});

// Delete timetable - requires authentication
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: `Timetable with ID ${req.params.id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Timetable deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to delete timetable ${req.params.id}`,
      error: error.message
    });
  }
});

// Add or update timetable slot - requires authentication
router.post('/slot', authenticateUser, async (req, res) => {
  try {
    const { timetableId, courseId, department, day, startTime, endTime, roomNumber } = req.body;
    
    let timetable;
    if (timetableId) {
      // Update existing timetable
      timetable = await Timetable.findById(timetableId);
      if (!timetable) {
        return res.status(404).json({
          success: false,
          message: `Timetable with ID ${timetableId} not found`
        });
      }
    } else {
      // Create new timetable
      timetable = await Timetable.create({
        courseId,
        slots: [],
        semester: 'Fall', // Default values
        year: new Date().getFullYear(),
        department
      });
    }
    
    // Add new slot
    timetable.slots.push({
      day,
      startTime,
      endTime,
      roomNumber
    });
    
    await timetable.save();
    
    res.status(200).json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add timetable slot',
      error: error.message
    });
  }
});

// Update specific timetable slot - requires authentication
router.put('/:timetableId/slot/:slotId', authenticateUser, async (req, res) => {
  try {
    const { day, startTime, endTime, roomNumber } = req.body;
    
    const timetable = await Timetable.findById(req.params.timetableId);
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: `Timetable with ID ${req.params.timetableId} not found`
      });
    }
    
    const slotIndex = timetable.slots.findIndex(
      slot => String(slot._id) === req.params.slotId
    );
    
    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Slot with ID ${req.params.slotId} not found in timetable`
      });
    }
    
    // Update slot fields
    timetable.slots[slotIndex].day = day;
    timetable.slots[slotIndex].startTime = startTime;
    timetable.slots[slotIndex].endTime = endTime;
    timetable.slots[slotIndex].roomNumber = roomNumber;
    
    await timetable.save();
    
    res.status(200).json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update timetable slot',
      error: error.message
    });
  }
});

// Delete specific timetable slot - requires authentication
router.delete('/:timetableId/slot/:slotId', authenticateUser, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.timetableId);
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: `Timetable with ID ${req.params.timetableId} not found`
      });
    }
    
    const slotIndex = timetable.slots.findIndex(
      slot => String(slot._id) === req.params.slotId
    );
    
    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Slot with ID ${req.params.slotId} not found in timetable`
      });
    }
    
    // Remove slot
    timetable.slots.splice(slotIndex, 1);
    await timetable.save();
    
    res.status(200).json({
      success: true,
      message: 'Timetable slot deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete timetable slot',
      error: error.message
    });
  }
});

// Check if a slot is available (no conflicts)
router.post('/check-slot-availability', async (req, res) => {
  try {
    const { day, startTime, roomNumber, timetableId, slotId, department } = req.body;
    
    // Find all timetables that have a slot with the same room, day and time
    // but exclude the current timetable and slot if they're provided
    const conflict = await Timetable.findOne({
      // If we're checking for a department, limit the check to that department
      ...(department && { department }),
      // Don't match the current timetable we're updating
      ...(timetableId && { _id: { $ne: timetableId } }),
      slots: {
        $elemMatch: {
          day: day,
          startTime: startTime,
          roomNumber: roomNumber,
          // If slotId is provided, don't match that specific slot
          ...(slotId && { _id: { $ne: slotId } })
        }
      }
    }).populate('courseId');
    
    if (conflict) {
      const conflictSlot = conflict.slots.find(
        s => s.day === day && s.startTime === startTime && s.roomNumber === roomNumber
      );
      
      return res.status(200).json({
        available: false,
        message: `Room ${roomNumber} is already booked at ${day} ${startTime} for ${conflict.courseId.courseCode}`,
        conflict: {
          course: conflict.courseId.courseCode,
          professor: conflict.courseId.professor,
          slot: conflictSlot
        }
      });
    }
    
    res.status(200).json({
      available: true,
      message: `Room ${roomNumber} is available on ${day} at ${startTime}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check slot availability',
      error: error.message
    });
  }
});

// Generate timetables for a department - requires authentication
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { department, semester = 'Fall', year = new Date().getFullYear(), regenerate = false } = req.body;
    
    // If regenerate flag is true, delete all existing timetables for this department
    if (regenerate) {
      await Timetable.deleteMany({ department });
    }
    
    // Get all courses for this department
    const Course = mongoose.model('Course');
    const courses = await Course.find({ department });
    
    // Get all rooms (if classrooms collection exists)
    let rooms = [];
    try {
      const Classroom = mongoose.model('Classroom');
      rooms = await Classroom.find({ isAvailable: true });
    } catch (error) {
      // If Classroom model doesn't exist or other error, use some default rooms
      rooms = [
        { roomNumber: 'NC101', type: 'NC', capacity: 60 },
        { roomNumber: 'NC102', type: 'NC', capacity: 60 },
        { roomNumber: 'NR201', type: 'NR', capacity: 150 },
        { roomNumber: 'NR202', type: 'NR', capacity: 150 },
        { roomNumber: 'CS-101', type: 'LAB', capacity: 30, department: 'cs' },
        { roomNumber: 'EE-101', type: 'LAB', capacity: 30, department: 'ee' }
      ];
    }
    
    // Define time slots available
    const timeSlots = [
      { start: '8 AM', end: '9 AM' },
      { start: '9 AM', end: '10 AM' },
      { start: '10 AM', end: '11 AM' },
      { start: '11 AM', end: '12 PM' },
      { start: '12 PM', end: '1 PM' },
      { start: '2 PM', end: '3 PM' },
      { start: '3 PM', end: '4 PM' },
      { start: '4 PM', end: '5 PM' },
      { start: '5 PM', end: '6 PM' }
    ];
    
    // Very simple algorithm for now - randomly assign slots
    const createdTimetables = [];
    
    for (const course of courses) {
      // Determine number of slots needed based on credits
      const slotsCount = Math.max(1, Math.min(course.credits, 5));
      
      const timetable = new Timetable({
        courseId: course._id,
        slots: [],
        semester,
        year,
        department
      });
      
      // For each needed slot, pick a random day, time and room
      for (let i = 0; i < slotsCount; i++) {
        const day = days[Math.floor(Math.random() * days.length)];
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        
        timetable.slots.push({
          day,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          roomNumber: room.roomNumber
        });
      }
      
      await timetable.save();
      createdTimetables.push(timetable);
    }
    
    res.status(201).json({
      success: true,
      message: `Created ${createdTimetables.length} timetables for department ${department}`,
      timetables: createdTimetables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate timetables',
      error: error.message
    });
  }
});

// Days array used by the generate endpoint
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

module.exports = router;
