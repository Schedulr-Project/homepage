// Must mock before importing
jest.mock('axios');

// Then import
import axios from 'axios';

// Now import the service that uses axios
import { 
  getCourses, 
  getCoursesByDepartment, 
  getClassrooms, 
  getTimetablesByDepartment,
  getFreeRooms 
} from '../api';

describe('API Service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getCourses', () => {
    it('fetches courses successfully', async () => {
      const mockCourses = [
        { _id: '1', courseCode: 'CS101', courseName: 'Intro to CS' }
      ];
      
      // Fix how we mock axios
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockCourses });
      
      const result = await getCourses();
      
      expect(result).toEqual(mockCourses);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/courses'));
    });
    
    it('handles errors when fetching courses', async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(getCourses()).rejects.toThrow('Network error');
    });
  });
  
  describe('getCoursesByDepartment', () => {
    it('fetches courses for a specific department', async () => {
      const mockCourses = [
        { _id: '1', courseCode: 'CS101', courseName: 'Intro to CS', department: 'cs' }
      ];
      
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockCourses });
      
      const result = await getCoursesByDepartment('cs');
      
      expect(result).toEqual(mockCourses);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/courses/department/cs'));
    });
  });
  
  describe('getClassrooms', () => {
    it('fetches all classrooms', async () => {
      const mockClassrooms = [
        { _id: '1', roomNumber: 'NC101', type: 'NC' }
      ];
      
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockClassrooms });
      
      const result = await getClassrooms();
      
      expect(result).toEqual(mockClassrooms);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/classrooms'));
    });
  });
  
  describe('getTimetablesByDepartment', () => {
    it('fetches timetables for a specific department', async () => {
      const mockTimetables = [
        { _id: '1', courseId: '1', department: 'cs' }
      ];
      
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockTimetables });
      
      const result = await getTimetablesByDepartment('cs');
      
      expect(result).toEqual(mockTimetables);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/timetables/department/cs'));
    });
  });
  
  describe('getFreeRooms', () => {
    it('fetches free rooms for a specific day and time slot', async () => {
      const mockFreeRooms = {
        day: 'Monday',
        timeSlot: '8 AM',
        rooms: {
          NC: [],
          NR: [],
          LAB: []
        }
      };
      
      (axios.get as jest.Mock).mockResolvedValueOnce({ 
        status: 200,
        data: mockFreeRooms 
      });
      
      const result = await getFreeRooms('Monday', '8 AM');
      
      expect(result).toEqual(mockFreeRooms);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/classrooms/free'),
        expect.objectContaining({
          params: expect.objectContaining({
            day: 'Monday',
            timeSlot: '8 AM'
          })
        })
      );
    });
    
    it('handles server errors properly', async () => {
      (axios.get as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      });
      
      await expect(getFreeRooms('Monday', '8 AM')).rejects.toThrow('Server error');
    });
  });
});
