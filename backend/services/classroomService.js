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
    // For lab courses, prioritize department-specific labs regardless of capacity
    if (type === 'LAB') {
      console.log(`Looking for ${department.toUpperCase()} labs for course with ${studentCount} students`);
      
      // First try: exact department match
      const departmentLabs = await Classroom.find({
        type: 'LAB',
        department: department.toLowerCase(),
        isAvailable: true
      });
      
      console.log(`Found ${departmentLabs.length} ${department.toUpperCase()} labs`);
      
      if (departmentLabs.length > 0) {
        return shuffleArray(departmentLabs);
      }
      
      // Second try: any lab
      console.log(`No ${department.toUpperCase()} labs available, trying any lab`);
      const anyLabs = await Classroom.find({
        type: 'LAB',
        isAvailable: true
      });
      
      if (anyLabs.length > 0) {
        return shuffleArray(anyLabs);
      }
      
      // Final fallback: NR rooms
      console.log(`No labs available at all, falling back to NR rooms`);
      return findSuitableClassrooms(studentCount, department, 'NR');
    }
    
    // For regular rooms (NC/NR)
    let query = { 
      isAvailable: true,
      capacity: { $gte: studentCount } 
    };
    
    if (type) {
      query.type = type;
    } else {
      query.type = studentCount < 100 ? 'NC' : 'NR';
    }
    
    const rooms = await Classroom.find(query);
    
    if (rooms.length === 0 && type === 'NC') {
      console.log(`No NC rooms available with capacity >= ${studentCount}, trying NR rooms`);
      return findSuitableClassrooms(studentCount, department, 'NR');
    }
    
    if (rooms.length === 0) {
      // Last resort: get any available room regardless of capacity
      console.log(`No rooms match criteria, trying any available room`);
      const anyRoom = await Classroom.find({ isAvailable: true })
        .sort({ capacity: -1 })
        .limit(5);
      
      return anyRoom;
    }
    
    return shuffleArray(rooms).slice(0, 5);
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
    console.log("Starting classroom allocation with department-specific labs...");
    const allocations = [];
    const courseClassrooms = {};
    const usedRooms = new Set();
    
    // Sort courses to prioritize lab courses first
    const courseIds = Object.keys(courseSlots).sort((a, b) => {
      const courseA = courses[a];
      const courseB = courses[b];
      
      if (!courseA || !courseB) return 0;
      
      // Lab courses (2 credits) first
      if (courseA.credits !== courseB.credits) {
        return courseB.credits - courseA.credits;
      }
      
      // Then by student count (larger classes get priority)
      return courseB.students - courseA.students;
    });
    
    // First pass: allocate labs to 2-credit courses
    for (const courseId of courseIds) {
      const course = courses[courseId];
      if (!course) continue;
      
      if (course.credits === 2) {
        console.log(`Allocating lab for ${course.courseCode} (${course.department.toUpperCase()}) with ${course.students} students`);
        
        // Get department-specific labs
        const suitableRooms = await findSuitableClassrooms(
          course.students, 
          course.department, 
          'LAB'
        );
        
        // Filter out already used rooms
        const availableRooms = suitableRooms.filter(room => !usedRooms.has(room.roomNumber));
        
        if (availableRooms.length > 0) {
          // Select a random room from available options
          const randomIndex = Math.floor(Math.random() * availableRooms.length);
          const selectedRoom = availableRooms[randomIndex];
          
          courseClassrooms[courseId] = selectedRoom.roomNumber;
          usedRooms.add(selectedRoom.roomNumber);
          
          console.log(`✅ Assigned ${course.department.toUpperCase()} course ${course.courseCode} to ${selectedRoom.roomNumber}`);
        } else if (suitableRooms.length > 0) {
          // If all suitable rooms are used, force allocation
          const selectedRoom = suitableRooms[0];
          courseClassrooms[courseId] = selectedRoom.roomNumber;
          console.log(`⚠️ Force-assigned ${course.courseCode} to ${selectedRoom.roomNumber} (already in use)`);
        }
      }
    }
    
    // Second pass: allocate regular rooms to remaining courses
    for (const courseId of courseIds) {
      // Skip if already assigned
      if (courseClassrooms[courseId]) continue;
      
      const course = courses[courseId];
      if (!course) continue;
      
      console.log(`Allocating room for ${course.courseCode} with ${course.students} students`);
      
      const classroomType = course.students < 100 ? 'NC' : 'NR';
      const suitableRooms = await findSuitableClassrooms(course.students, course.department, classroomType);
      
      // Filter out already used rooms
      const availableRooms = suitableRooms.filter(room => !usedRooms.has(room.roomNumber));
      
      if (availableRooms.length > 0) {
        // Select a random room
        const randomIndex = Math.floor(Math.random() * availableRooms.length);
        const selectedRoom = availableRooms[randomIndex];
        
        courseClassrooms[courseId] = selectedRoom.roomNumber;
        usedRooms.add(selectedRoom.roomNumber);
        
        console.log(`✅ Assigned course ${course.courseCode} to ${selectedRoom.roomNumber}`);
      } else if (suitableRooms.length > 0) {
        // If all suitable rooms are used, force allocation
        const selectedRoom = suitableRooms[0];
        courseClassrooms[courseId] = selectedRoom.roomNumber;
        console.log(`⚠️ Force-assigned ${course.courseCode} to ${selectedRoom.roomNumber} (already in use)`);
      } else {
        console.error(`❌ Could not find any suitable room for ${course.courseCode}`);
      }
    }
    
    // Third pass: Update all slots with the assigned rooms
    for (const courseId in courseSlots) {
      const slots = courseSlots[courseId];
      const assignedRoom = courseClassrooms[courseId];
      
      if (!assignedRoom) {
        console.error(`No room assigned for course ${courses[courseId]?.courseCode}`);
        continue;
      }
      
      slots.forEach(slot => {
        slot.roomNumber = assignedRoom;
      });
    }
    
    console.log("Room allocation completed successfully");
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
