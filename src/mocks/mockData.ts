import { Course, Classroom, Timetable } from '../services/api';

export const mockCourses: Course[] = [
  {
    _id: '1',
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    department: 'cs',
    credits: 4,
    professor: 'Dr. Smith',
    students: 60
  },
  {
    _id: '2',
    courseCode: 'CS202',
    courseName: 'Data Structures',
    department: 'cs',
    credits: 3,
    professor: 'Dr. Johnson',
    students: 45
  },
  {
    _id: '3',
    courseCode: 'EE101',
    courseName: 'Electrical Circuits',
    department: 'ee',
    credits: 4,
    professor: 'Dr. Williams',
    students: 55
  }
];

export const mockClassrooms: Classroom[] = [
  {
    _id: '1',
    roomNumber: 'NC101',
    type: 'NC',
    capacity: 60,
    floor: 1,
    features: {
      hasProjector: true,
      hasComputers: false,
      hasAC: true
    },
    isAvailable: true
  },
  {
    _id: '2',
    roomNumber: 'NR201',
    type: 'NR',
    capacity: 150,
    floor: 2,
    features: {
      hasProjector: true,
      hasComputers: false,
      hasAC: true
    },
    isAvailable: true
  },
  {
    _id: '3',
    roomNumber: 'CS-101',
    type: 'LAB',
    capacity: 30,
    department: 'cs',
    floor: 1,
    features: {
      hasProjector: true,
      hasComputers: true,
      hasAC: true
    },
    isAvailable: true
  }
];

export const mockTimetables = [
  {
    _id: '1',
    courseId: {
      _id: '1',
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      department: 'cs',
      credits: 4,
      professor: 'Dr. Smith',
      students: 60
    },
    slots: [
      {
        _id: 'slot1',
        day: 'Monday',
        startTime: '9 AM',
        endTime: '10 AM',
        roomNumber: 'NC101'
      },
      {
        _id: 'slot2',
        day: 'Wednesday',
        startTime: '9 AM',
        endTime: '10 AM',
        roomNumber: 'NC101'
      }
    ],
    semester: 'Fall',
    year: 2023,
    department: 'cs'
  },
  {
    _id: '2',
    courseId: {
      _id: '2',
      courseCode: 'CS202',
      courseName: 'Data Structures',
      department: 'cs',
      credits: 3,
      professor: 'Dr. Johnson',
      students: 45
    },
    slots: [
      {
        _id: 'slot3',
        day: 'Tuesday',
        startTime: '2 PM',
        endTime: '3 PM',
        roomNumber: 'NR201'
      }
    ],
    semester: 'Fall',
    year: 2023,
    department: 'cs'
  }
];
