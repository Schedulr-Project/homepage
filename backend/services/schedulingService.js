/**
 * Service to generate timetable schedules based on course data using the algorithm
 * described in algo.txt
 */

const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const fs = require('fs');
const path = require('path');

// Add this function for logging
const logToFile = (message) => {
  const logDir = path.join(__dirname, '../logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  
  // Append to the log file
  fs.appendFileSync(path.join(logDir, 'scheduling.log'), logMessage);
  
  // Also log to console
  console.log(message);
};

// Define days and time slots
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { start: '8 AM', end: '9 AM' },
  { start: '9 AM', end: '10 AM' },
  { start: '10 AM', end: '11 AM' },
  { start: '11 AM', end: '12 PM' },
  { start: '12 PM', end: '1 PM' }, // Potential lunch break
  { start: '2 PM', end: '3 PM' },
  { start: '3 PM', end: '4 PM' },
  { start: '4 PM', end: '5 PM' },
  { start: '5 PM', end: '6 PM' }
];

// Instead of a fixed break slot, implement a more flexible approach
// We'll try to create a break between slots 1-5 (8 AM to 12 PM)
const isPotentialBreakSlot = (slotIndex) => {
  return slotIndex >= 1 && slotIndex <= 5; // Between 8 AM - 12 PM
};

// Modified function to preserve potential break slots
const shouldPreserveForBreak = (timetable, day, slotIndex) => {
  // Only consider slots between 8 AM and 12 PM
  if (!isPotentialBreakSlot(slotIndex)) return false;
  
  // Check if we have at least 3 classes already scheduled on this day
  const classesScheduled = timetable[day].filter(slot => slot !== null).length;
  
  // If we have 3+ classes and no break yet, try to preserve this slot as a break
  if (classesScheduled >= 3) {
    // Check if we already have a break in the 8-12 time frame
    const hasBreak = timetable[day].some((slot, idx) => 
      isPotentialBreakSlot(idx) && slot === null
    );
    
    // If no break exists yet, preserve this slot
    return !hasBreak;
  }
  
  return false;
};

// Count scheduled courses on each day
const getCoursesPerDay = (timetable) => {
  const coursesPerDay = {};
  DAYS.forEach(day => {
    coursesPerDay[day] = new Set();
    timetable[day].forEach(slot => {
      if (slot !== null) {
        coursesPerDay[day].add(slot.courseId.toString());
      }
    });
  });
  
  return Object.fromEntries(
    Object.entries(coursesPerDay).map(([day, courseSet]) => [day, courseSet.size])
  );
};

// Find days with fewest scheduled courses
const findLeastPopulatedDays = (timetable) => {
  const coursesPerDay = getCoursesPerDay(timetable);
  const minCourses = Math.min(...Object.values(coursesPerDay));
  
  return DAYS.filter(day => coursesPerDay[day] === minCourses);
};

// Initialize empty timetable
const initializeTimetable = () => {
  const timetable = {};
  DAYS.forEach(day => {
    timetable[day] = Array(TIME_SLOTS.length).fill(null);
  });
  return timetable;
};

// Check if a slot is available
const isSlotAvailable = (timetable, day, slotIndex) => {
  return timetable[day][slotIndex] === null;
};

// Check if consecutive slots are available
const areConsecutiveSlotsAvailable = (timetable, day, startSlotIndex, count) => {
  for (let i = 0; i < count; i++) {
    if (startSlotIndex + i >= TIME_SLOTS.length || !isSlotAvailable(timetable, day, startSlotIndex + i)) {
      return false;
    }
  }
  return true;
};

// New function to find available 3-hour blocks (preferably in the afternoon)
const findAvailable3HourBlock = (timetable, professor) => {
  // First try afternoon slots (after 1 PM, which starts at index 5)
  for (const day of DAYS) {
    for (let slotIndex = 5; slotIndex <= TIME_SLOTS.length - 3; slotIndex++) {
      if (areConsecutiveSlotsAvailable(timetable, day, slotIndex, 3) &&
          professorIsFree(timetable, day, slotIndex, professor) &&
          professorIsFree(timetable, day, slotIndex + 1, professor) &&
          professorIsFree(timetable, day, slotIndex + 2, professor)) {
        return { day, slotIndex };
      }
    }
  }
  
  // If no afternoon slots are available, try morning slots
  for (const day of DAYS) {
    for (let slotIndex = 0; slotIndex <= TIME_SLOTS.length - 3; slotIndex++) {
      if (areConsecutiveSlotsAvailable(timetable, day, slotIndex, 3) &&
          professorIsFree(timetable, day, slotIndex, professor) &&
          professorIsFree(timetable, day, slotIndex + 1, professor) &&
          professorIsFree(timetable, day, slotIndex + 2, professor)) {
        return { day, slotIndex };
      }
    }
  }
  
  return null; // No 3-hour block found
};

// Assign course to slots
const assignCourseToSlots = (timetable, day, startSlotIndex, count, course) => {
  for (let i = 0; i < count; i++) {
    timetable[day][startSlotIndex + i] = {
      courseCode: course.courseCode,
      professor: course.professor,
      courseId: course._id
    };
  }
};

// Check if professor has another class at the same time
const professorIsFree = (timetable, day, slotIndex, professor) => {
  for (const d of DAYS) {
    if (timetable[d][slotIndex] && timetable[d][slotIndex].professor === professor && d !== day) {
      return false;
    }
  }
  return true;
};

// Check if a course is already scheduled on a given day
const isCourseScheduledOnDay = (courseSlots, courseId, day) => {
  if (!courseSlots[courseId]) {
    console.error(`Missing course slots for course ID: ${courseId}`);
    return false;
  }
  return courseSlots[courseId].some(slot => slot.day === day);
};

// Count how many slots a course has on a specific day
const countCourseSessionsOnDay = (courseSlots, courseId, day) => {
  if (!courseSlots[courseId]) {
    console.error(`Missing course slots for course ID: ${courseId}`);
    return 0;
  }
  return courseSlots[courseId].filter(slot => slot.day === day).length;
};

// Count number of days with scheduled courses
const countDaysWithCourses = (timetable) => {
  return DAYS.reduce((count, day) => {
    const hasScheduledCourse = timetable[day].some(slot => slot !== null);
    return hasScheduledCourse ? count + 1 : count;
  }, 0);
};

// Find empty days (days with no scheduled courses)
const findEmptyDays = (timetable) => {
  return DAYS.filter(day => !timetable[day].some(slot => slot !== null));
};

// Ensure consistent ID format - handles both string IDs and MongoDB ObjectIDs
const ensureStringId = (id) => {
  if (!id) return '';
  return typeof id === 'object' ? id.toString() : String(id);
};

// New function to assign a fixed classroom to each course
const assignClassroomsToCourses = (courses) => {
  const classrooms = {};
  
  // Create classrooms - first batch is standard rooms, second batch is labs
  const standardRooms = Array.from({ length: 10 }, (_, i) => `Room-${100 + i}`);
  const labRooms = Array.from({ length: 5 }, (_, i) => `Lab-${200 + i}`);
  
  let standardRoomIndex = 0;
  let labRoomIndex = 0;
  
  courses.forEach(course => {
    const courseId = ensureStringId(course._id);
    
    // Assign lab rooms to 2-credit courses (which get 3-hour blocks)
    if (course.credits === 2) {
      classrooms[courseId] = labRooms[labRoomIndex % labRooms.length];
      labRoomIndex++;
    } else {
      classrooms[courseId] = standardRooms[standardRoomIndex % standardRooms.length];
      standardRoomIndex++;
    }
  });
  
  return classrooms;
};

/**
 * Generate timetable for a set of courses
 * @param {Array} courses - Array of course objects
 * @param {String} semester - Semester for timetable
 * @param {Number} year - Year for timetable
 * @returns {Object} Generated timetable
 */
const generateTimetable = async (courses, semester, year, departmentId) => {
  // Initialize empty timetable
  const timetable = initializeTimetable();
  
  // Debug log courses
  console.log(`Starting timetable generation for ${courses.length} courses:`);
  courses.forEach(course => {
    console.log(`${course.courseCode}: ${course.credits} credits, ${course.students} students, ID: ${ensureStringId(course._id)}`);
  });
  
  // Sort courses by credits (descending) then by number of students (descending)
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.credits !== b.credits) {
      return b.credits - a.credits; // Higher credits first
    }
    return b.students - a.students; // More students first if credits are equal
  });
  
  // Assign fixed classrooms to each course
  const courseClassrooms = assignClassroomsToCourses(sortedCourses);
  
  // Map to track remaining hours for each course
  const remainingHours = {};
  // Store generated time slots for each course
  const courseSlots = {};
  
  sortedCourses.forEach(course => {
    // Make sure we correctly convert any ID format to string
    const courseId = ensureStringId(course._id);
    remainingHours[courseId] = course.credits;
    courseSlots[courseId] = [];
  });

  // Track day usage for better distribution
  const dayUsage = {};
  DAYS.forEach(day => dayUsage[day] = 0);

  // Check if we can potentially fit all courses
  const totalSlots = DAYS.length * TIME_SLOTS.length;
  const totalCreditHours = sortedCourses.reduce((sum, course) => sum + course.credits, 0);
  console.log(`Total available slots: ${totalSlots}, Total credit hours: ${totalCreditHours}`);
  
  // Process 2-credit courses first and distribute them evenly across days
  const twoCreditCourses = sortedCourses.filter(course => course.credits === 2);
  
  console.log(`Found ${twoCreditCourses.length} 2-credit courses that need 3-hour blocks`);
  
  // Distribution strategy for 2-credit courses:
  // We'll explicitly target low-usage days for better distribution
  for (const course of twoCreditCourses) {
    const courseId = ensureStringId(course._id);
    
    // Get the fixed classroom assigned to this course
    const fixedClassroom = courseClassrooms[courseId];
    
    console.log(`Scheduling 3-hour block for 2-credit course: ${course.courseCode} in ${fixedClassroom}`);
    
    // Sort days by usage (least used days first)
    const daysOrderedByUsage = [...DAYS].sort((a, b) => dayUsage[a] - dayUsage[b]);
    let blockAssigned = false;
    
    for (const day of daysOrderedByUsage) {
      // First try afternoon slots (after 1 PM) - preferred for labs
      for (let slotIndex = 5; slotIndex <= TIME_SLOTS.length - 3; slotIndex++) {
        if (areConsecutiveSlotsAvailable(timetable, day, slotIndex, 3) &&
            professorIsFree(timetable, day, slotIndex, course.professor) &&
            professorIsFree(timetable, day, slotIndex + 1, course.professor) &&
            professorIsFree(timetable, day, slotIndex + 2, course.professor)) {
          
          // Assign course to the 3-hour continuous block
          assignCourseToSlots(timetable, day, slotIndex, 3, course);
          remainingHours[courseId] = 0;
          
          // Create three 1-hour slots in courseSlots for database
          for (let i = 0; i < 3; i++) {
            courseSlots[courseId].push({
              day,
              startTime: TIME_SLOTS[slotIndex + i].start,
              endTime: TIME_SLOTS[slotIndex + i].end,
              roomNumber: fixedClassroom
            });
          }
          
          // Increase day usage - weight 3-hour blocks higher
          dayUsage[day] += 1.5; // Give more weight to longer blocks
          
          console.log(`Scheduled 3-hour block for ${course.courseCode} on ${day} (usage now: ${dayUsage[day]}) in ${fixedClassroom}`);
          
          blockAssigned = true;
          break;
        }
      }
      
      if (blockAssigned) break;
      
      // If afternoon slots are not available, try morning slots
      for (let slotIndex = 0; slotIndex <= TIME_SLOTS.length - 3; slotIndex++) {
        // Skip already tried afternoon slots
        if (slotIndex >= 5) continue;
        
        if (areConsecutiveSlotsAvailable(timetable, day, slotIndex, 3) &&
            professorIsFree(timetable, day, slotIndex, course.professor) &&
            professorIsFree(timetable, day, slotIndex + 1, course.professor) &&
            professorIsFree(timetable, day, slotIndex + 2, course.professor)) {
          
          assignCourseToSlots(timetable, day, slotIndex, 3, course);
          remainingHours[courseId] = 0;
          
          for (let i = 0; i < 3; i++) {
            courseSlots[courseId].push({
              day,
              startTime: TIME_SLOTS[slotIndex + i].start,
              endTime: TIME_SLOTS[slotIndex + i].end,
              roomNumber: fixedClassroom
            });
          }
          
          // Increase day usage
          dayUsage[day] += 1.5;
          
          console.log(`Scheduled 3-hour block for ${course.courseCode} on ${day} (usage now: ${dayUsage[day]}) in ${fixedClassroom}`);
          
          blockAssigned = true;
          break;
        }
      }
      
      if (blockAssigned) break;
    }
    
    // Force scheduling if necessary
    if (!blockAssigned) {
      // Get the least used day
      const leastUsedDay = daysOrderedByUsage[0];
      
      console.log(`Forcing 3-hour block for ${course.courseCode} on least used day: ${leastUsedDay}`);
      
      // Try afternoon slots first (index 5 and up)
      for (let startSlot = 5; startSlot <= TIME_SLOTS.length - 3; startSlot++) {
        let canClear = true;
        
        // Check professor availability
        if (!professorIsFree(timetable, leastUsedDay, startSlot, course.professor) ||
            !professorIsFree(timetable, leastUsedDay, startSlot + 1, course.professor) ||
            !professorIsFree(timetable, leastUsedDay, startSlot + 2, course.professor)) {
          continue;
        }
        
        // Clear any occupied slots
        for (let i = 0; i < 3; i++) {
          if (!isSlotAvailable(timetable, leastUsedDay, startSlot + i)) {
            timetable[leastUsedDay][startSlot + i] = null;
          }
        }
        
        // Assign course to slots
        assignCourseToSlots(timetable, leastUsedDay, startSlot, 3, course);
        remainingHours[courseId] = 0;
        
        // Store slots
        for (let i = 0; i < 3; i++) {
          courseSlots[courseId].push({
            day: leastUsedDay,
            startTime: TIME_SLOTS[startSlot + i].start,
            endTime: TIME_SLOTS[startSlot + i].end,
            roomNumber: fixedClassroom
          });
        }
        
        dayUsage[leastUsedDay] += 1.5;
        console.log(`FORCED 3-hour block for ${course.courseCode} on ${leastUsedDay} (usage now: ${dayUsage[leastUsedDay]}) in ${fixedClassroom}`);
        
        blockAssigned = true;
        break;
      }
      
      // If still not assigned, try morning slots
      if (!blockAssigned) {
        for (let startSlot = 0; startSlot < 5; startSlot++) {
          if (startSlot + 2 >= TIME_SLOTS.length) continue;
          
          // Check professor availability
          if (!professorIsFree(timetable, leastUsedDay, startSlot, course.professor) ||
              !professorIsFree(timetable, leastUsedDay, startSlot + 1, course.professor) ||
              !professorIsFree(timetable, leastUsedDay, startSlot + 2, course.professor)) {
            continue;
          }
          
          // Clear any occupied slots
          for (let i = 0; i < 3; i++) {
            if (!isSlotAvailable(timetable, leastUsedDay, startSlot + i)) {
              timetable[leastUsedDay][startSlot + i] = null;
            }
          }
          
          // Assign course to slots
          assignCourseToSlots(timetable, leastUsedDay, startSlot, 3, course);
          remainingHours[courseId] = 0;
          
          // Store slots
          for (let i = 0; i < 3; i++) {
            courseSlots[courseId].push({
              day: leastUsedDay,
              startTime: TIME_SLOTS[startSlot + i].start,
              endTime: TIME_SLOTS[startSlot + i].end,
              roomNumber: fixedClassroom
            });
          }
          
          dayUsage[leastUsedDay] += 1.5;
          console.log(`FORCED morning 3-hour block for ${course.courseCode} on ${leastUsedDay} (usage now: ${dayUsage[leastUsedDay]}) in ${fixedClassroom}`);
          
          blockAssigned = true;
          break;
        }
      }
      
      if (!blockAssigned) {
        console.error(`CRITICAL: Failed to create 3-hour block for ${course.courseCode}. This should never happen.`);
      }
    }
  }
  
  // PHASE 1: Distribute the regular courses with balanced day usage
  for (const course of sortedCourses) {
    const courseId = ensureStringId(course._id);
    
    // Skip 2-credit courses as they've already been scheduled
    if (course.credits === 2 || remainingHours[courseId] <= 0) continue;
    
    // Get the fixed classroom assigned to this course
    const fixedClassroom = courseClassrooms[courseId];
    console.log(`PHASE 1: Processing ${course.courseCode} with ${remainingHours[courseId]} credits in ${fixedClassroom}`);
    
    // Try to distribute each credit hour across different days, prioritizing days with lowest usage
    while (remainingHours[courseId] > 0) {
      // Sort days by current usage (least used first)
      const daysOrderedByUsage = [...DAYS].sort((a, b) => dayUsage[a] - dayUsage[b]);
      let scheduled = false;
      
      for (const day of daysOrderedByUsage) {
        // Try to schedule on this day
        for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
          if (isSlotAvailable(timetable, day, slotIndex) && 
              professorIsFree(timetable, day, slotIndex, course.professor)) {
            
            // Assign course to this slot
            assignCourseToSlots(timetable, day, slotIndex, 1, course);
            remainingHours[courseId] -= 1;
            
            // Store slot information with fixed classroom
            courseSlots[courseId].push({
              day,
              startTime: TIME_SLOTS[slotIndex].start,
              endTime: TIME_SLOTS[slotIndex].end,
              roomNumber: fixedClassroom
            });
            
            // Increment day usage
            dayUsage[day] += 1;
            
            scheduled = true;
            console.log(`Scheduled 1 hr of ${course.courseCode} on ${day} (usage now: ${dayUsage[day]}) in ${fixedClassroom}`);
            break;
          }
        }
        
        // Try next day if we scheduled on this one or if we couldn't schedule
        if (scheduled || remainingHours[courseId] <= 0) break;
      }
      
      // If we couldn't schedule anywhere, we have a problem
      if (!scheduled) {
        console.error(`Failed to schedule remaining ${remainingHours[courseId]} hours for ${course.courseCode}`);
        break;
      }
    }
  }
  
  // Create timetables in the database
  const createdTimetables = [];
  
  for (const course of sortedCourses) {
    const courseId = ensureStringId(course._id);
    const slots = courseSlots[courseId];
    
    if (slots.length > 0) {
      const timetableData = {
        courseId: course._id,
        slots,
        semester,
        year,
        department: departmentId
      };
      
      try {
        const newTimetable = new Timetable(timetableData);
        const savedTimetable = await newTimetable.save();
        createdTimetables.push(savedTimetable);
        console.log(`Successfully created timetable for ${course.courseCode} with ${slots.length} slots in ${courseClassrooms[courseId]}`);
      } catch (error) {
        console.error(`Error saving timetable for course ${course.courseCode}:`, error);
      }
    } else {
      console.error(`No slots generated for course ${course.courseCode}`);
    }
  }

  // Final distribution report
  const finalDistribution = getCoursesPerDay(timetable);
  console.log("Final course distribution by day:");
  for (const day of DAYS) {
    console.log(`${day}: ${finalDistribution[day]} courses (usage weight: ${dayUsage[day].toFixed(1)})`);
  }
  
  return {
    timetable,
    courseSlots,
    createdTimetables,
    success: createdTimetables.length === sortedCourses.length
  };
};

module.exports = {
  generateTimetable
};
