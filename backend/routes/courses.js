const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateUser, authorizeAdmin } = require('../middleware/auth');

// Define Course Schema
const CourseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  professor: {
    type: String,
    required: true,
    trim: true
  },
  students: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

// Create Course Model if it doesn't exist already
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
});

// Get courses by department
router.get('/department/:department', async (req, res) => {
  try {
    const department = req.params.department;
    let query = {};
    
    if (department !== 'all') {
      query.department = department;
    }
    
    const courses = await Course.find(query);
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch courses for department ${req.params.department}`,
      error: error.message
    });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with ID ${req.params.id} not found`
      });
    }
    
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch course ${req.params.id}`,
      error: error.message
    });
  }
});

// Create new course - requires authentication
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { courseCode, courseName, department, credits, professor, students } = req.body;
    
    // Check if course with this code already exists
    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: `Course with code ${courseCode} already exists`
      });
    }
    
    const course = await Course.create({
      courseCode,
      courseName,
      department,
      credits,
      professor,
      students
    });
    
    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
});

// Update course - requires authentication
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with ID ${req.params.id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update course ${req.params.id}`,
      error: error.message
    });
  }
});

// Delete course - requires authentication
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with ID ${req.params.id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Course ${course.courseCode} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to delete course ${req.params.id}`,
      error: error.message
    });
  }
});

module.exports = router;
