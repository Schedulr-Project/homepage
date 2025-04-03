import { rest, RestHandler } from 'msw';
import { mockCourses, mockTimetables, mockClassrooms } from './mockData'; // Ensure './mockData' exists and is correctly typed
import { Course, TimeSlot, Classroom } from '../services/api'; // Ensure '../services/api' exports these types

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const handlers: RestHandler[] = [
  rest.get(`${API_URL}/courses`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockCourses)
    );
  }),

  rest.get(`${API_URL}/courses/department/:dept`, (req, res, ctx) => {
    const { dept } = req.params as { dept: string };
    const filteredCourses = mockCourses.filter((course: Course) => course.department === dept);
    return res(
      ctx.status(200),
      ctx.json(filteredCourses)
    );
  }),

  rest.get(`${API_URL}/timetables/department/:dept`, (req, res, ctx) => {
    const { dept } = req.params as { dept: string };
    const filteredTimetables = mockTimetables.filter((tt: { department: string }) => tt.department === dept);
    return res(
      ctx.status(200),
      ctx.json(filteredTimetables)
    );
  }),

  rest.get(`${API_URL}/classrooms`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockClassrooms)
    );
  }),

  rest.get(`${API_URL}/classrooms/free`, (req, res, ctx) => {
    const day = req.url.searchParams.get('day');
    const timeSlot = req.url.searchParams.get('timeSlot');
    
    const occupiedRoomNumbers = new Set<string>();
    mockTimetables.forEach((tt: { slots: TimeSlot[] }) => {
      tt.slots.forEach((slot: TimeSlot) => {
        if (slot.day === day && slot.startTime === timeSlot) {
          occupiedRoomNumbers.add(slot.roomNumber);
        }
      });
    });
    
    const freeRooms = mockClassrooms.filter((room: Classroom) => !occupiedRoomNumbers.has(room.roomNumber));
    
    const NC = freeRooms.filter((room: Classroom) => room.type === 'NC');
    const NR = freeRooms.filter((room: Classroom) => room.type === 'NR');
    const LAB = freeRooms.filter((room: Classroom) => room.type === 'LAB');
    
    return res(
      ctx.status(200),
      ctx.json({
        day,
        timeSlot,
        totalFreeRooms: freeRooms.length,
        rooms: { NC, NR, LAB }
      })
    );
  })
];
