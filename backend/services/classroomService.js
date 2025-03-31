/**
 * Service to manage classroom allocation and scheduling
 */

const Classroom = require('../models/Classroom');

/**
 * Find suitable classrooms for a course based on student count
 * @param {Number} studentCount - Number of students in the course
 * @param {String} department - Course department
 * @param {String} type - Optional classroom type (NC, NR, LAB)
 * @returns {Promise<Array>} - Array of suitable classrooms
 */
const findSuitableClassrooms = async (studentCount, department, type = null) => {
  try {
    // Base query to find rooms with sufficient capacity
    let query = { capacity: { $gte: studentCount }, isAvailable: true };
    
    // If specific type requested, filter by it
    if (type) {
      query.type = type;
    } else {
      if (studentCount < 100) {
        query.type = { $in: ['NC', 'NR'] };
      } else {
        query.type = 'NR';
      }
    }

    // For Lab rooms, match by department
    if (type === 'LAB') {
      query.department = department;
      const labs = await Classroom.find(query);
      return shuffleArray(labs).slice(0, 1); // Use helper function instead of sort()
    }

    // Get all available rooms
    const classrooms = await Classroom.find(query);
    
    if (classrooms.length === 0 && type === 'NC') {
      console.log(`No NC rooms available for ${studentCount} students, trying NR rooms`);
      return findSuitableClassrooms(studentCount, department, 'NR');
    }

    // Randomize rooms after fetching
    const randomizedRooms = shuffleArray(classrooms).slice(0, 5);
    return randomizedRooms;

  } catch (error) {
    console.error('Error finding suitable classrooms:', error);
    throw error;
  }
};

/**
 * Check if a classroom is available in a given timeslot
 * @param {String} roomNumber - The room number to check
 * @param {String} day - Day of the week
 * @param {Number} startSlot - Starting time slot index
 * @param {Number} duration - Number of consecutive hours
 * @param {Array} existingAllocations - Currently allocated rooms
 * @returns {Boolean} - True if room is available
 */
const isRoomAvailable = (roomNumber, day, startSlot, duration, existingAllocations) => {
  // Check if the room is already allocated during any of the requested timeslots
  for (let slot = startSlot; slot < startSlot + duration; slot++) {
    const conflictingAllocation = existingAllocations.find(alloc => 
      alloc.roomNumber === roomNumber && 
      alloc.day === day && 
      alloc.timeSlot === slot
    );
    
    if (conflictingAllocation) {
      return false;
    }
  }
  
  return true;
};

/**
 * Allocate classrooms for courses in a timetable
 * @param {Object} courseSlots - Map of course slots by course ID
 * @param {Object} courses - Map of courses by ID
 * @returns {Object} - Updated course slots with room allocations
 */
const allocateClassrooms = async (courseSlots, courses) => {
  try {
    const allocations = [];
    const courseClassrooms = {};
    const usedRooms = new Set();
    
    for (const courseId in courseSlots) {
      const course = courses[courseId];
      
      if (!course) continue;
      
      let classroomType = course.credits === 2 ? 'LAB' : (course.students < 100 ? 'NC' : 'NR');
      let suitableRooms = [];
      let attempts = 0;
      const maxAttempts = 10;

      do {
        // Get available rooms and ensure proper room number format
        const query = {
          type: classroomType,
          capacity: { $gte: course.students },
          isAvailable: true
        };

        if (classroomType === 'LAB') {
          query.department = course.department;
        }

        const availableRooms = await Classroom.find(query);
        suitableRooms = shuffleArray(availableRooms)
          .filter(room => !usedRooms.has(room.roomNumber))
          .slice(0, 5);

        attempts++;

        // Try NR rooms if no NC rooms available
        if (attempts >= maxAttempts && suitableRooms.length === 0 && classroomType === 'NC') {
          classroomType = 'NR';
          attempts = 0;
        }
      } while (suitableRooms.length === 0 && attempts < maxAttempts);

      // If still no rooms, try any available room as last resort
      if (suitableRooms.length === 0) {
        const anyRoom = await Classroom.findOne({ isAvailable: true });
        if (anyRoom) suitableRooms = [anyRoom];
      }

      if (suitableRooms.length > 0) {
        const selectedRoom = suitableRooms[0];
        courseClassrooms[courseId] = selectedRoom.roomNumber;
        usedRooms.add(selectedRoom.roomNumber);
        console.log(`Assigned ${selectedRoom.roomNumber} to course ${course.courseCode}`);
      }
    }

    // Update course slots with assigned rooms
    for (const courseId in courseSlots) {
      const slots = courseSlots[courseId];
      const assignedRoom = courseClassrooms[courseId];
      
      if (assignedRoom) {
        slots.forEach(slot => {
          slot.roomNumber = assignedRoom;
          allocations.push({
            courseId,
            roomNumber: assignedRoom,
            day: slot.day,
            timeSlot: getTimeSlotIndex(slot.startTime)
          });
        });
      }
    }

    return courseSlots;
  } catch (error) {
    console.error('Error allocating classrooms:', error);
    throw error;
  }
};

// Helper function to convert time strings to slot indices
const getTimeSlotIndex = (timeStr) => {
  const timeMap = {
    '8 AM': 0,
    '9 AM': 1,
    '10 AM': 2,
    '11 AM': 3,
    '12 PM': 4,
    '2 PM': 5,
    '3 PM': 6,
    '4 PM': 7,
    '5 PM': 8
  };
  return timeMap[timeStr] !== undefined ? timeMap[timeStr] : -1;
};

// Helper to shuffle array randomly
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Export module functions
module.exports = {
  findSuitableClassrooms,
  isRoomAvailable,
  allocateClassrooms
};
