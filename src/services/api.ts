import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Course {
  _id?: string;
  courseCode: string;
  courseName: string;
  department: string;
  credits: number;
  professor: string;
  students: number;
}

export interface TimeSlot {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
}

export interface Timetable {
  _id?: string;
  courseId: string;
  slots: TimeSlot[];
  semester: string;
  year: number;
}

export interface Classroom {
  _id?: string;
  roomNumber: string;
  type: 'NC' | 'NR' | 'LAB';
  capacity: number;
  department?: string;
  floor: number;
  features: {
    hasProjector: boolean;
    hasComputers: boolean;
    hasAC: boolean;
  };
  isAvailable: boolean;
}

// Course API calls
export const getCourses = async () => {
  try {
    const response = await axios.get(`${API_URL}/courses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const getCoursesByDepartment = async (department: string) => {
  try {
    const response = await axios.get(`${API_URL}/courses/department/${department}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching courses for department ${department}:`, error);
    throw error;
  }
};

export const getCourse = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

export const createCourse = async (course: Course) => {
  try {
    const response = await axios.post(`${API_URL}/courses`, course);
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const updateCourse = async (id: string, course: Course) => {
  try {
    const response = await axios.put(`${API_URL}/courses/${id}`, course);
    return response.data;
  } catch (error) {
    console.error(`Error updating course ${id}:`, error);
    throw error;
  }
};

export const deleteCourse = async (id: string) => {
  try {
    const response = await axios.delete(`${API_URL}/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting course ${id}:`, error);
    throw error;
  }
};

// Timetable API calls
export const getTimetables = async () => {
  try {
    const response = await axios.get(`${API_URL}/timetables`);
    return response.data;
  } catch (error) {
    console.error('Error fetching timetables:', error);
    throw error;
  }
};

export const getTimetableForCourse = async (courseId: string) => {
  try {
    const response = await axios.get(`${API_URL}/timetables/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching timetable for course ${courseId}:`, error);
    throw error;
  }
};

export const getTimetablesByDepartment = async (department: string) => {
  try {
    const response = await axios.get(`${API_URL}/timetables/department/${department}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching timetables for department ${department}:`, error);
    throw error;
  }
};

export const createTimetable = async (timetable: Timetable) => {
  try {
    const response = await axios.post(`${API_URL}/timetables`, timetable);
    return response.data;
  } catch (error) {
    console.error('Error creating timetable:', error);
    throw error;
  }
};

export const updateTimetable = async (id: string, timetable: Partial<Timetable>) => {
  try {
    const response = await axios.put(`${API_URL}/timetables/${id}`, timetable);
    return response.data;
  } catch (error) {
    console.error(`Error updating timetable ${id}:`, error);
    throw error;
  }
};

export const deleteTimetable = async (id: string) => {
  try {
    const response = await axios.delete(`${API_URL}/timetables/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting timetable ${id}:`, error);
    throw error;
  }
};

// Generate timetables for a department
export const generateTimetables = async (data: { 
  department: string;
  semester?: string;
  year?: number;
  regenerate?: boolean; // Add this optional flag
}) => {
  try {
    const response = await axios.post(`${API_URL}/timetables/generate`, data);
    return response.data;
  } catch (error) {
    console.error('Error generating timetables:', error);
    throw error;
  }
};

// New API calls for timetable editing
export const updateTimetableSlot = async (data: {
  timetableId: string;
  slotId?: string;
  isNewSlot: boolean;
  department: string;
  courseId: string;
  roomNumber: string;
  day: string;
  startTime: string;
  endTime: string;
}) => {
  try {
    if (data.isNewSlot) {
      // Creating a new slot (either adding to existing timetable or creating new one)
      const response = await axios.post(`${API_URL}/timetables/slot`, data);
      return response.data;
    } else {
      // Updating an existing slot
      const response = await axios.put(
        `${API_URL}/timetables/${data.timetableId}/slot/${data.slotId}`, 
        data
      );
      return response.data;
    }
  } catch (error) {
    console.error('Error updating timetable slot:', error);
    throw error;
  }
};

// Delete a specific timetable slot
export const deleteTimetableSlot = async (timetableId: string, slotId: string) => {
  try {
    const response = await axios.delete(`${API_URL}/timetables/${timetableId}/slot/${slotId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting timetable slot:', error);
    throw error;
  }
};

// Check if a slot is available (no conflicts)
export const checkSlotAvailability = async (data: {
  day: string;
  startTime: string;
  roomNumber: string;
  timetableId?: string;
  slotId?: string;
  department?: string; // Add department parameter
}) => {
  try {
    const response = await axios.post(`${API_URL}/timetables/check-slot-availability`, data);
    return response.data;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    throw error;
  }
};

// Classroom API calls
export const getClassrooms = async () => {
  try {
    const response = await axios.get(`${API_URL}/classrooms`);
    return response.data;
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw error;
  }
};

export const getClassroomsByType = async (type: 'NC' | 'NR' | 'LAB') => {
  try {
    const response = await axios.get(`${API_URL}/classrooms/type/${type}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${type} classrooms:`, error);
    throw error;
  }
};

export const getClassroomsByDepartment = async (department: string) => {
  try {
    const response = await axios.get(`${API_URL}/classrooms/department/${department}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching classrooms for department ${department}:`, error);
    throw error;
  }
};

export const getClassroom = async (roomNumber: string) => {
  try {
    const response = await axios.get(`${API_URL}/classrooms/${roomNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching classroom ${roomNumber}:`, error);
    throw error;
  }
};

// New function to find free rooms based on day and time with cache busting
export const getFreeRooms = async (day: string, timeSlot: string, timestamp?: number) => {
  try {
    console.log(`API call: Fetching free rooms for ${day} at ${timeSlot}`);
    const response = await axios.get(`${API_URL}/classrooms/free`, {
      params: { 
        day, 
        timeSlot,
        _t: timestamp || new Date().getTime() // Cache busting parameter
      },
      // Increase timeout for potentially slow queries
      timeout: 10000
    });
    
    console.log('API response status:', response.status);
    
    if (response.status !== 200) {
      throw new Error(`Server returned status code ${response.status}`);
    }
    
    if (!response.data) {
      throw new Error('Empty response from server');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching free rooms:', error);
    
    // Check for specific axios error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      // Get message from response if available
      const message = error.response.data?.message || `Server error: ${error.response.status}`;
      throw new Error(message);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server. Check your network connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('An unexpected error occurred');
    }
  }
};
