const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');

// Get all classrooms
router.get('/', async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get classrooms by type (NC, NR, LAB)
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['NC', 'NR', 'LAB'].includes(type)) {
      return res.status(400).json({ message: 'Invalid room type. Must be NC, NR, or LAB.' });
    }
    
    const classrooms = await Classroom.find({ type });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get classrooms by department (relevant for LAB rooms)
router.get('/department/:dept', async (req, res) => {
  try {
    const classrooms = await Classroom.find({ department: req.params.dept });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get classroom by room number
router.get('/:roomNumber', async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ roomNumber: req.params.roomNumber });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new classroom
router.post('/', async (req, res) => {
  const classroom = new Classroom(req.body);
  try {
    const newClassroom = await classroom.save();
    res.status(201).json(newClassroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a classroom
router.put('/:roomNumber', async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ roomNumber: req.params.roomNumber });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    Object.assign(classroom, req.body);
    const updatedClassroom = await classroom.save();
    res.json(updatedClassroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a classroom
router.delete('/:roomNumber', async (req, res) => {
  try {
    const result = await Classroom.deleteOne({ roomNumber: req.params.roomNumber });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    res.json({ message: 'Classroom deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get classrooms by floor
router.get('/floor/:floorNumber', async (req, res) => {
  try {
    const floor = parseInt(req.params.floorNumber);
    if (isNaN(floor) || floor < 1 || floor > 3) {
      return res.status(400).json({ message: 'Invalid floor number. Must be 1, 2, or 3.' });
    }
    
    const classrooms = await Classroom.find({ floor });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
