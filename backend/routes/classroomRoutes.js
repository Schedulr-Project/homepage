const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const Timetable = require('../models/Timetable'); // Added Timetable model

// Get all classrooms
router.get('/', async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    console.log(`Found ${classrooms.length} total classrooms`);
    res.json(classrooms);
  } catch (err) {
    console.error('Error fetching all classrooms:', err);
    res.status(500).json({ message: err.message });
  }
});

// New endpoint to get free rooms based on day and time - MOVED UP IN ROUTE ORDER
router.get('/free', async (req, res) => {
  try {
    console.log('Free rooms API called with query:', req.query);
    const { day, timeSlot } = req.query;
    
    if (!day || !timeSlot) {
      console.log('Missing day or timeSlot parameters');
      return res.status(400).json({ 
        message: 'Day and timeSlot are required query parameters',
        rooms: { NC: [], NR: [], LAB: [] }
      });
    }
    
    // Get all rooms first with more error handling
    let allRooms = [];
    try {
      allRooms = await Classroom.find({ isAvailable: true });
      console.log(`Query successful. Found ${allRooms.length} available classrooms`);
    } catch (dbError) {
      console.error('Database error when finding classrooms:', dbError);
      return res.status(500).json({
        message: `Database error: ${dbError.message}`,
        rooms: { NC: [], NR: [], LAB: [] }
      });
    }
    
    // Check if we have any classrooms at all
    if (allRooms.length === 0) {
      console.log('No classrooms found even though database check says they exist');
      return res.json({
        day,
        timeSlot,
        totalFreeRooms: 0,
        rooms: { NC: [], NR: [], LAB: [] },
        message: 'No available classrooms found. Make sure classrooms are marked as available.'
      });
    }
    
    // Find rooms that are occupied in the given time slot
    let timetablesWithSlots = [];
    try {
      timetablesWithSlots = await Timetable.find({
        'slots.day': day,
        'slots.startTime': timeSlot
      });
      console.log(`Found ${timetablesWithSlots.length} timetables with slots at ${day} ${timeSlot}`);
    } catch (ttError) {
      console.error('Error when finding occupied timetable slots:', ttError);
    }
    
    // Extract room numbers from occupied rooms
    const occupiedRoomNumbers = new Set();
    timetablesWithSlots.forEach(timetable => {
      timetable.slots.forEach(slot => {
        if (slot.day === day && slot.startTime === timeSlot) {
          occupiedRoomNumbers.add(slot.roomNumber);
        }
      });
    });
    
    console.log(`Found ${occupiedRoomNumbers.size} occupied rooms`);
    
    // Filter out occupied rooms
    const freeRooms = allRooms.filter(room => !occupiedRoomNumbers.has(room.roomNumber));
    console.log(`Calculated ${freeRooms.length} free rooms`);
    
    // Group rooms by type for better organization
    const groupedRooms = {
      NC: freeRooms.filter(room => room.type === 'NC'),
      NR: freeRooms.filter(room => room.type === 'NR'),
      LAB: freeRooms.filter(room => room.type === 'LAB')
    };
    
    console.log(`Sending response with ${freeRooms.length} free rooms (${groupedRooms.NC.length} NC, ${groupedRooms.NR.length} NR, ${groupedRooms.LAB.length} LAB)`);
    
    res.json({
      day,
      timeSlot,
      totalFreeRooms: freeRooms.length,
      rooms: groupedRooms
    });
  } catch (err) {
    console.error('Error finding free rooms:', err);
    res.status(500).json({ 
      message: `Server error: ${err.message}`,
      rooms: { NC: [], NR: [], LAB: [] } // Provide empty room structure
    });
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

// Get classroom by room number - MOVED DOWN after /free to avoid route collision
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

module.exports = router;
