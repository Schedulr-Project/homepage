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
