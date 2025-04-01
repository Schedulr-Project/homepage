const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const schedulingService = require('../services/schedulingService');

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

// Generate timetables for all courses in a department
router.post('/generate', async (req, res) => {
  try {
    const { 
      department, 
      semester = 'Fall', 
      year = new Date().getFullYear(),
      regenerate = false // New flag to indicate regeneration
    } = req.body;
    
    if (!department) {
      return res.status(400).json({ message: 'Department is required' });
    }
    
    // Find all courses in the department
    const courses = await Course.find({ department });
    
    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found in this department' });
    }
    
    // Delete existing timetables for this department if regenerating
    if (regenerate) {
      await Timetable.deleteMany({ 
        department, 
        semester, 
        year
      });
      console.log('Deleted existing timetables for regeneration');
    }
    
    // Generate new timetable with different slot allocations
    const { createdTimetables } = await schedulingService.generateTimetable(
      courses, 
      semester, 
      year, 
      department
    );
    
    res.status(201).json({
      message: `${regenerate ? 'Regenerated' : 'Generated'} timetables for ${createdTimetables.length} courses`,
      timetables: createdTimetables
    });
  } catch (err) {
    console.error('Error generating timetables:', err);
    res.status(500).json({ message: err.message });
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
