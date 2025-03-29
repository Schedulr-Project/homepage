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
  
  // Logging for debugging
  console.log(`Starting timetable generation for ${courses.length} courses with a total of ${
    courses.reduce((sum, course) => sum + course.credits, 0)
  } credit hours`);
  
  courses.forEach(course => {
    console.log(`${course.courseCode}: ${course.credits} credits, ${course.students} students`);
  });
  
  // Sort courses by credits (descending) then by number of students (descending)
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.credits !== b.credits) {
      return b.credits - a.credits; // Higher credits first
    }
    return b.students - a.students; // More students first if credits are equal
  });
  
  // Map to track remaining hours for each course
  const remainingHours = {};
  sortedCourses.forEach(course => {
    // Make sure we correctly convert MongoDB ObjectID to string
    const courseId = course._id.toString();
    remainingHours[courseId] = course.credits;
  });
  
  // Store generated time slots for each course
  const courseSlots = {};
  sortedCourses.forEach(course => {
    // Make sure we correctly convert MongoDB ObjectID to string
    const courseId = course._id.toString();
    courseSlots[courseId] = [];
  });

  // Check if we can potentially fit all courses
  const totalSlots = DAYS.length * TIME_SLOTS.length;
  const totalCreditHours = sortedCourses.reduce((sum, course) => sum + course.credits, 0);
  console.log(`Total available slots: ${totalSlots}, Total credit hours: ${totalCreditHours}`);
  
  if (totalCreditHours > totalSlots) {
    console.warn(`Warning: Total credit hours (${totalCreditHours}) exceed available slots (${totalSlots}). Some courses may not be fully scheduled.`);
  }
  
  // PHASE 1: First try to allocate one hour per course across days to ensure balanced distribution
  for (const course of sortedCourses) {
    const courseId = course._id.toString();
    console.log(`Phase 1: Processing ${course.courseCode} with ${remainingHours[courseId]} credits`);
    
    if (remainingHours[courseId] <= 0) continue;
    
    // First try empty days
    const emptyDays = findEmptyDays(timetable);
    let scheduled = false;
    
    if (emptyDays.length > 0) {
      for (const day of emptyDays) {
        if (remainingHours[courseId] <= 0) break;
        
        for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
          // Skip potential break slots initially
          if (isPotentialBreakSlot(slotIndex)) continue;
          
          if (isSlotAvailable(timetable, day, slotIndex) && 
              professorIsFree(timetable, day, slotIndex, course.professor)) {
            
            assignCourseToSlots(timetable, day, slotIndex, 1, course);
            remainingHours[courseId] -= 1;
            
            courseSlots[courseId].push({
              day,
              startTime: TIME_SLOTS[slotIndex].start,
              endTime: TIME_SLOTS[slotIndex].end,
              roomNumber: `Room-${Math.floor(100 + Math.random() * 900)}`
            });
            
            scheduled = true;
            console.log(`Phase 1: Scheduled ${course.courseCode} on empty day ${day} at ${TIME_SLOTS[slotIndex].start}`);
            break;
          }
        }
        
        // If couldn't schedule outside break slots, try any slot
        if (!scheduled) {
          for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
            if (isSlotAvailable(timetable, day, slotIndex) && 
                professorIsFree(timetable, day, slotIndex, course.professor)) {
              
              assignCourseToSlots(timetable, day, slotIndex, 1, course);
              remainingHours[courseId] -= 1;
              
              courseSlots[courseId].push({
                day,
                startTime: TIME_SLOTS[slotIndex].start,
                endTime: TIME_SLOTS[slotIndex].end,
                roomNumber: `Room-${Math.floor(100 + Math.random() * 900)}`
              });
              
              scheduled = true;
              console.log(`Phase 1: Scheduled ${course.courseCode} on empty day ${day} at ${TIME_SLOTS[slotIndex].start}`);
              break;
            }
          }
        }
        
        if (scheduled) break; // Move to next course if successfully scheduled
      }
    }
  }
  
  // PHASE 2: Now balance remaining hours across days, prioritizing days with fewer courses
  for (const course of sortedCourses) {
    const courseId = course._id.toString();
    if (remainingHours[courseId] <= 0) continue;
    
    console.log(`Phase 2: Balancing distribution for ${course.courseCode}, ${remainingHours[courseId]} hours left`);
    
    while (remainingHours[courseId] > 0) {
      let hourScheduled = false;
      
      // Get days with the fewest courses currently scheduled
      const leastPopulatedDays = findLeastPopulatedDays(timetable);
      console.log(`Least populated days: ${leastPopulatedDays.join(', ')}`);
      
      // First try days with fewest courses where this course isn't already scheduled
      for (const day of leastPopulatedDays) {
        if (isCourseScheduledOnDay(courseSlots, courseId, day)) continue;
        if (hourScheduled) break;
        
        for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
          if (shouldPreserveForBreak(timetable, day, slotIndex)) continue;
          
          if (isSlotAvailable(timetable, day, slotIndex) && 
              professorIsFree(timetable, day, slotIndex, course.professor)) {
            
            assignCourseToSlots(timetable, day, slotIndex, 1, course);
            remainingHours[courseId] -= 1;
            
            courseSlots[courseId].push({
              day,
              startTime: TIME_SLOTS[slotIndex].start,
              endTime: TIME_SLOTS[slotIndex].end,
              roomNumber: `Room-${Math.floor(100 + Math.random() * 900)}`
            });
            
            hourScheduled = true;
            console.log(`Phase 2: Scheduled ${course.courseCode} on least populated day ${day} at ${TIME_SLOTS[slotIndex].start}`);
            break;
          }
        }
      }
      
      // If that didn't work, try any day where this course isn't scheduled yet
      if (!hourScheduled) {
        for (const day of DAYS) {
          if (isCourseScheduledOnDay(courseSlots, courseId, day)) continue;
          if (hourScheduled) break;
          
          for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
            if (shouldPreserveForBreak(timetable, day, slotIndex)) continue;
            
            if (isSlotAvailable(timetable, day, slotIndex) && 
                professorIsFree(timetable, day, slotIndex, course.professor)) {
              
              assignCourseToSlots(timetable, day, slotIndex, 1, course);
              remainingHours[courseId] -= 1;
              
              courseSlots[courseId].push({
                day,
                startTime: TIME_SLOTS[slotIndex].start,
                endTime: TIME_SLOTS[slotIndex].end,
                roomNumber: `Room-${Math.floor(100 + Math.random() * 900)}`
              });
              
              hourScheduled = true;
              console.log(`Phase 2: Scheduled ${course.courseCode} on new day ${day} at ${TIME_SLOTS[slotIndex].start}`);
              break;
            }
          }
        }
      }
      
      // Finally, try any available slot on any day as a last resort
      if (!hourScheduled) {
        // First try the least populated days
        for (const day of findLeastPopulatedDays(timetable)) {
          if (hourScheduled) break;
          
          for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
            if (isSlotAvailable(timetable, day, slotIndex) && 
                professorIsFree(timetable, day, slotIndex, course.professor)) {
              
              assignCourseToSlots(timetable, day, slotIndex, 1, course);
              remainingHours[courseId] -= 1;
              
              courseSlots[courseId].push({
                day,
                startTime: TIME_SLOTS[slotIndex].start,
                endTime: TIME_SLOTS[slotIndex].end,
                roomNumber: `Room-${Math.floor(100 + Math.random() * 900)}`
              });
              
              hourScheduled = true;
              console.log(`Phase 2 (last resort): Scheduled ${course.courseCode} on day ${day} at ${TIME_SLOTS[slotIndex].start}`);
              break;
            }
          }
        }
        
        // If still not scheduled, try any day
        if (!hourScheduled) {
          for (const day of DAYS) {
            if (hourScheduled) break;
            
            for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
              if (isSlotAvailable(timetable, day, slotIndex) && 
                  professorIsFree(timetable, day, slotIndex, course.professor)) {
                
                assignCourseToSlots(timetable, day, slotIndex, 1, course);
                remainingHours[courseId] -= 1;
                
                courseSlots[courseId].push({
                  day,
                  startTime: TIME_SLOTS[slotIndex].start,
                  endTime: TIME_SLOTS[slotIndex].end,
                  roomNumber: `Room-${Math.floor(100 + Math.random() * 900)}`
                });
                
                hourScheduled = true;
                console.log(`Phase 2 (final resort): Scheduled ${course.courseCode} on day ${day} at ${TIME_SLOTS[slotIndex].start}`);
                break;
              }
            }
          }
        }
      }
      
      if (!hourScheduled) {
        console.error(`Could not allocate all required hours for course ${course.courseCode}. Remaining: ${remainingHours[courseId]}`);
        break;
      }
    }
  }

  // Create timetables in the database
  const createdTimetables = [];
  
  for (const course of sortedCourses) {
    const courseId = course._id.toString();
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
        console.log(`Successfully created timetable for ${course.courseCode} with ${slots.length} slots`);
      } catch (error) {
        console.error(`Error saving timetable for course ${course.courseCode}:`, error);
      }
    } else {
      console.error(`No slots generated for course ${course.courseCode}`);
    }
  }

  // Count how many days have courses scheduled
  const daysWithSchedule = countDaysWithCourses(timetable);
  console.log(`Scheduled courses on ${daysWithSchedule} out of ${DAYS.length} days`);
  
  // Check for any unallocated hours
  let unallocatedHoursCount = 0;
  for (const course of sortedCourses) {
    const courseId = course._id.toString();
    if (remainingHours[courseId] > 0) {
      console.error(`Warning: Course ${course.courseCode} has ${remainingHours[courseId]} unallocated hours`);
      unallocatedHoursCount += remainingHours[courseId];
    }
  }
  
  if (unallocatedHoursCount === 0) {
    console.log("Successfully allocated all course hours!");
  } else {
    console.log(`Failed to allocate ${unallocatedHoursCount} total course hours`);
  }
  
  // At the end, log the course distribution
  const finalDistribution = getCoursesPerDay(timetable);
  console.log("Final course distribution by day:");
  for (const day of DAYS) {
    console.log(`${day}: ${finalDistribution[day]} courses`);
  }
  
  return {
    timetable,
    courseSlots,
    createdTimetables,
    success: unallocatedHoursCount === 0
  };
};

module.exports = {
  generateTimetable
};
