const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const schedulingService = require('../services/schedulingService');
const mongoose = require('mongoose');
// Fix the import path and destructure the authenticateUser function
const { authenticateUser } = require('../middleware/auth');

// Get all timetables
router.get('/', async (req, res) => {
  try {
    const timetables = await Timetable.find().populate('courseId');
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get timetable by course ID
router.get('/course/:courseId', async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ 
      courseId: req.params.courseId 
    }).populate('courseId');
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get timetable by department
router.get('/department/:dept', async (req, res) => {
  try {
    // First find all courses in this department
    const courses = await Course.find({ department: req.params.dept });
    const courseIds = courses.map(course => course._id);
    
    // Then find timetables for these courses
    const timetables = await Timetable.find({
      courseId: { $in: courseIds }
    }).populate('courseId');
    
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new timetable
router.post('/', async (req, res) => {
  // First check if the course exists
  try {
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const timetable = new Timetable(req.body);
    const newTimetable = await timetable.save();
    res.status(201).json(newTimetable);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a timetable
router.put('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    if (req.body.slots) {
      timetable.slots = req.body.slots;
    }
    if (req.body.semester) {
      timetable.semester = req.body.semester;
    }
    if (req.body.year) {
      timetable.year = req.body.year;
    }
    
    const updatedTimetable = await timetable.save();
    res.json(updatedTimetable);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a timetable
router.delete('/:id', async (req, res) => {
  try {
    const result = await Timetable.deleteOne({ _id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    res.json({ message: 'Timetable deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate timetables for a department - requires authentication
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { department, semester = 'Fall', year = new Date().getFullYear(), regenerate = false } = req.body;
    
    // Check if department is provided
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department is required'
      });
    }
    
    console.log(`Generating timetables for ${department}, regenerate=${regenerate}`);
    
    // If regenerate flag is true, delete all existing timetables for this department
    if (regenerate) {
      const deletedInfo = await Timetable.deleteMany({ department });
      console.log(`Deleted ${deletedInfo.deletedCount} existing timetables for department ${department}`);
    }
    
    // Get all courses for this department with complete details
    const courses = await Course.find({ department }).lean();
    
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No courses found for department ${department}`
      });
    }
    
    console.log(`Found ${courses.length} courses for department ${department}`);
    
    // Get all rooms (if classrooms collection exists)
    let rooms = [];
    try {
      const Classroom = mongoose.model('Classroom');
      rooms = await Classroom.find({ isAvailable: true }).lean();
      console.log(`Found ${rooms.length} available classrooms`);
    } catch (error) {
      console.error('Error finding classrooms:', error);
      // If Classroom model doesn't exist or other error, use some default rooms
      rooms = [
        { roomNumber: 'NC101', type: 'NC', capacity: 60 },
        { roomNumber: 'NC102', type: 'NC', capacity: 60 },
        { roomNumber: 'NR201', type: 'NR', capacity: 150 },
        { roomNumber: 'NR202', type: 'NR', capacity: 150 },
        { roomNumber: `${department.toUpperCase()}-101`, type: 'LAB', capacity: 30, department },
      ];
      console.log(`Using ${rooms.length} default classrooms`);
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
    
    // Define special lab time slots (3-hour blocks)
    const labTimeSlots = [
      { start: '2 PM', end: '5 PM' },
      { start: '9 AM', end: '12 PM' },
    ];
    
    // Days array used for generation
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Algorithm for assigning slots - improved to avoid conflicts
    const createdTimetables = [];
    const occupiedSlots = new Map(); // Map to track which room+day+time is occupied
    
    for (const course of courses) {
      // Simplified logic: ALL 2-credit courses are lab courses
      const isLabCourse = course.credits === 2;
      
      // For lab courses, create one 3-hour slot instead of multiple 1-hour slots
      const slotsCount = isLabCourse ? 1 : Math.max(1, Math.min(course.credits, 5));
      
      const timetable = new Timetable({
        courseId: course._id,
        slots: [],
        semester,
        year,
        department
      });
      
      console.log(`Creating timetable for ${course.courseCode} with ${slotsCount} slots${isLabCourse ? ' (LAB COURSE)' : ''}`);
      
      // For each needed slot, pick a day, time and room that isn't already occupied
      let assignedSlots = 0;
      let attemptCount = 0; // Prevent infinite loops
      
      while (assignedSlots < slotsCount && attemptCount < 50) {
        attemptCount++;
        
        const dayIndex = Math.floor(Math.random() * days.length);
        const day = days[dayIndex];
        
        // Use lab time slots for lab courses, regular time slots otherwise
        const availableTimeSlots = isLabCourse ? labTimeSlots : timeSlots;
        const timeIndex = Math.floor(Math.random() * availableTimeSlots.length);
        const timeSlot = availableTimeSlots[timeIndex];
        
        // Filter rooms based on course needs and prioritize department labs
        let roomPool = [...rooms]; // Start with all rooms
        
        // For ALL lab courses (2-credit courses), only use LAB rooms
        if (isLabCourse) {
          // First try to find lab rooms of the same department
          const departmentLabs = rooms.filter(room => 
            room.type === 'LAB' && room.department === department
          );
          
          if (departmentLabs.length > 0) {
            // If department labs are available, only use those
            roomPool = departmentLabs;
            console.log(`  Using department lab rooms for ${course.courseCode}`);
          } else {
            // If no department labs, use any lab room
            const allLabs = rooms.filter(room => room.type === 'LAB');
            if (allLabs.length > 0) {
              roomPool = allLabs;
              console.log(`  No ${department} labs available, using other lab rooms`);
            }
            // If no labs at all, fall back to all rooms
          }
        }
        
        // Select a random room from the filtered pool
        const roomIndex = Math.floor(Math.random() * roomPool.length);
        const room = roomPool[roomIndex];
        
        // Create a unique key for this slot
        const slotKey = `${day}-${timeSlot.start}-${room.roomNumber}`;
        
        // For 3-hour lab slots, check if any of the hours conflict with existing slots
        let hasConflict = false;
        
        if (isLabCourse) {
          // For lab courses, need to check all hours in the 3-hour block
          const startHour = parseInt(timeSlot.start.split(' ')[0]);
          for (let h = 0; h < 3; h++) {
            const hourToCheck = `${startHour + h} ${timeSlot.start.split(' ')[1]}`;
            const hourKey = `${day}-${hourToCheck}-${room.roomNumber}`;
            if (occupiedSlots.has(hourKey)) {
              hasConflict = true;
              break;
            }
          }
        } else {
          // For regular courses, just check the exact time slot
          hasConflict = occupiedSlots.has(slotKey);
        }
        
        // Check if this slot is already occupied
        if (!hasConflict) {
          // Slot is available, add it to the timetable
          timetable.slots.push({
            day,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            roomNumber: room.roomNumber
          });
          
          // Mark this slot (and adjacent slots for labs) as occupied
          if (isLabCourse) {
            // Mark all hours in the lab slot as occupied
            const startHour = parseInt(timeSlot.start.split(' ')[0]);
            for (let h = 0; h < 3; h++) {
              const hourToMark = `${startHour + h} ${timeSlot.start.split(' ')[1]}`;
              const hourKey = `${day}-${hourToMark}-${room.roomNumber}`;
              occupiedSlots.set(hourKey, course.courseCode);
            }
          } else {
            occupiedSlots.set(slotKey, course.courseCode);
          }
          
          assignedSlots++;
          
          console.log(`  Assigned slot ${assignedSlots}/${slotsCount}: ${day}, ${timeSlot.start}-${timeSlot.end}, Room ${room.roomNumber}`);
        }
      }
      
      if (assignedSlots < slotsCount) {
        console.warn(`⚠️ Could only assign ${assignedSlots}/${slotsCount} slots for ${course.courseCode}`);
      }
      
      await timetable.save();
      createdTimetables.push(timetable);
    }
    
    // Return the created timetables with course details populated
    const populatedTimetables = await Timetable.find({ department })
      .populate('courseId')
      .lean();
    
    res.status(201).json({
      success: true,
      message: `Created ${createdTimetables.length} timetables for department ${department}`,
      timetables: populatedTimetables
    });
  } catch (error) {
    console.error('Failed to generate timetables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate timetables',
      error: error.message
    });
  }
});

// Add new endpoints for slot-level operations

// Check slot availability (no time/room conflicts)
router.post('/check-slot-availability', async (req, res) => {
  try {
    const { day, startTime, roomNumber, timetableId = '', slotId = '', department = '' } = req.body;
    
    // Basic validation
    if (!day || !startTime || !roomNumber) {
      return res.status(400).json({ 
        available: false, 
        message: 'Missing required fields' 
      });
    }

    // Check for time slot and room conflicts
    const conflictQuery = {
      'slots.day': day,
      'slots.startTime': startTime,
      'slots.roomNumber': roomNumber
    };
    
    // Exclude the current slot from conflict check if editing
    if (timetableId && slotId) {
      conflictQuery.$and = [
        { _id: { $ne: timetableId } },
        { 'slots._id': { $ne: slotId } }
      ];
    }
    
    const roomConflict = await Timetable.findOne(conflictQuery);
    
    if (roomConflict) {
      // Get details about the conflict for informative message
      const conflictingCourse = await Course.findById(roomConflict.courseId);
      
      return res.json({
        available: false,
        message: `Room ${roomNumber} is already booked at ${startTime} on ${day} by ${conflictingCourse ? conflictingCourse.courseCode : 'another course'}.`
      });
    }
    
    // Check for professor conflicts (same professor teaching at same time)
    if (timetableId) {
      const currentTimetable = await Timetable.findById(timetableId).populate('courseId');
      
      if (currentTimetable) {
        const professorName = currentTimetable.courseId.professor;
        
        // Find if this professor is teaching elsewhere at the same time
        const professorConflict = await Timetable.findOne({
          _id: { $ne: timetableId },
          'slots.day': day,
          'slots.startTime': startTime
        }).populate('courseId');
        
        if (professorConflict && professorConflict.courseId.professor === professorName) {
          return res.json({
            available: false,
            message: `Professor ${professorName} is already teaching ${professorConflict.courseId.courseCode} at this time.`
          });
        }
      }
    }

    // New: Check for department-level conflicts (same department having multiple classes at same time)
    if (department) {
      // Find all timetables for this department at the same time slot
      const departmentConflicts = await Timetable.find({
        department: department,
        'slots.day': day,
        'slots.startTime': startTime
      }).populate('courseId');

      // If editing, exclude the current slot
      const filteredConflicts = timetableId ? 
        departmentConflicts.filter(tt => tt._id.toString() !== timetableId) : 
        departmentConflicts;
        
      if (filteredConflicts.length > 0) {
        const conflictingCourse = filteredConflicts[0].courseId;
        return res.json({
          available: false,
          message: `Department ${department.toUpperCase()} already has class ${conflictingCourse.courseCode} scheduled at ${startTime} on ${day}. Multiple classes from the same department at the same time may cause student scheduling conflicts.`
        });
      }
    }
    
    // If no conflicts, return success
    return res.json({ available: true, message: 'Slot is available' });
    
  } catch (err) {
    console.error('Error checking slot availability:', err);
    res.status(500).json({ 
      available: false, 
      message: 'Server error checking availability' 
    });
  }
});

// Create or update a timetable slot
router.post('/slot', async (req, res) => {
  try {
    const { department, courseId, roomNumber, day, startTime, endTime } = req.body;
    
    // Validation
    if (!department || !courseId || !roomNumber || !day || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find or create a timetable for this course
    let timetable = await Timetable.findOne({ courseId });
    
    if (!timetable) {
      // Create a new timetable for this course if it doesn't exist
      timetable = new Timetable({
        courseId,
        department,
        semester: 'Fall', // Default values
        year: new Date().getFullYear(),
        slots: []
      });
    }
    
    // Add the new slot
    timetable.slots.push({
      day,
      startTime,
      endTime,
      roomNumber
    });
    
    await timetable.save();
    res.status(201).json({ message: 'Slot created', timetable });
    
  } catch (err) {
    console.error('Error creating timetable slot:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a specific slot in a timetable
router.put('/:timetableId/slot/:slotId', async (req, res) => {
  try {
    const { timetableId, slotId } = req.params;
    const { roomNumber, day, startTime, endTime } = req.body;
    
    // Find the timetable
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Find the specific slot
    const slotIndex = timetable.slots.findIndex(slot => slot._id.toString() === slotId);
    if (slotIndex === -1) {
      return res.status(404).json({ message: 'Slot not found in timetable' });
    }
    
    // Update the slot
    timetable.slots[slotIndex].roomNumber = roomNumber;
    timetable.slots[slotIndex].day = day;
    timetable.slots[slotIndex].startTime = startTime;
    timetable.slots[slotIndex].endTime = endTime;
    
    await timetable.save();
    res.json({ message: 'Slot updated', timetable });
    
  } catch (err) {
    console.error('Error updating timetable slot:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a specific slot from a timetable
router.delete('/:timetableId/slot/:slotId', async (req, res) => {
  try {
    const { timetableId, slotId } = req.params;
    
    // Find the timetable
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Filter out the specified slot
    timetable.slots = timetable.slots.filter(
      slot => slot._id.toString() !== slotId
    );
    
    await timetable.save();
    res.json({ message: 'Slot deleted', timetable });
  } catch (err) {
    console.error('Error deleting timetable slot:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
