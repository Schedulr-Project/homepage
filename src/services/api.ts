import axios from 'axios';
import { getToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL
});

// Add request interceptor to include auth token with all API requests
// Fix TypeScript errors by explicitly typing parameters as 'any'
api.interceptors.request.use(
  function(config: any): any {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function(error: any): any {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
// Fix TypeScript errors by explicitly typing parameters as 'any'
api.interceptors.response.use(
  function(response: any): any {
    return response;
  },
  function(error: any): any {
    // Handle 401 Unauthorized error by redirecting to login
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Add a flag to show all network requests in console
const DEBUG_API = true;

// Enhance the API instance with request/response logging
if (DEBUG_API) {
  console.log('API debugging enabled');
  
  // Debug requests
  const originalRequest = api.request;
  api.request = function(...args: any[]) {
    console.log('🌐 API Request:', args[0]?.method?.toUpperCase(), args[0]?.url);
    if (args[0]?.data) console.log('📤 Request Data:', args[0].data);
    return originalRequest.apply(this, args);
  };
}

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
    const response = await api.get('/courses');
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const getCoursesByDepartment = async (department: string) => {
  try {
    const response = await api.get(`/courses/department/${department}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching courses for department ${department}:`, error);
    throw error;
  }
};

export const getCourse = async (id: string) => {
  try {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

export const createCourse = async (course: Course) => {
  try {
    const response = await api.post('/courses', course);
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const updateCourse = async (id: string, course: Course) => {
  try {
    const response = await api.put(`/courses/${id}`, course);
    return response.data;
  } catch (error) {
    console.error(`Error updating course ${id}:`, error);
    throw error;
  }
};

export const deleteCourse = async (id: string) => {
  try {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting course ${id}:`, error);
    throw error;
  }
};

// Timetable API calls
export const getTimetables = async () => {
  try {
    const response = await api.get('/timetables');
    return response.data;
  } catch (error) {
    console.error('Error fetching timetables:', error);
    throw error;
  }
};

export const getTimetableForCourse = async (courseId: string) => {
  try {
    const response = await api.get(`/timetables/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching timetable for course ${courseId}:`, error);
    throw error;
  }
};

export const getTimetablesByDepartment = async (department: string) => {
  try {
    const response = await api.get(`/timetables/department/${department}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching timetables for department ${department}:`, error);
    throw error;
  }
};

export const createTimetable = async (timetable: Timetable) => {
  try {
    const response = await api.post('/timetables', timetable);
    return response.data;
  } catch (error) {
    console.error('Error creating timetable:', error);
    throw error;
  }
};

export const updateTimetable = async (id: string, timetable: Partial<Timetable>) => {
  try {
    const response = await api.put(`/timetables/${id}`, timetable);
    return response.data;
  } catch (error) {
    console.error(`Error updating timetable ${id}:`, error);
    throw error;
  }
};

export const deleteTimetable = async (id: string) => {
  try {
    const response = await api.delete(`/timetables/${id}`);
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
    const response = await api.post('/timetables/generate', data);
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
      const response = await api.post('/timetables/slot', data);
      return response.data;
    } else {
      // Updating an existing slot
      const response = await api.put(
        `/timetables/${data.timetableId}/slot/${data.slotId}`, 
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
    const response = await api.delete(`/timetables/${timetableId}/slot/${slotId}`);
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
    const response = await api.post('/timetables/check-slot-availability', data);
    return response.data;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    throw error;
  }
};

// Classroom API calls
export const getClassrooms = async () => {
  try {
    const response = await api.get('/classrooms');
    return response.data;
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw error;
  }
};

export const getClassroomsByType = async (type: 'NC' | 'NR' | 'LAB') => {
  try {
    const response = await api.get(`/classrooms/type/${type}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${type} classrooms:`, error);
    throw error;
  }
};

export const getClassroomsByDepartment = async (department: string) => {
  try {
    const response = await api.get(`/classrooms/department/${department}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching classrooms for department ${department}:`, error);
    throw error;
  }
};

export const getClassroom = async (roomNumber: string) => {
  try {
    const response = await api.get(`/classrooms/${roomNumber}`);
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
    const response = await api.get('/classrooms/free', {
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

// Auth API calls
export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    console.log('API: Attempting login for', credentials.email);
    const response = await api.post('/auth/login', credentials);
    console.log('API: Login response received');
    return response.data;
  } catch (error) {
    console.error('API: Login failed:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};
