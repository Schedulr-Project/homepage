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

module.exports = router;
