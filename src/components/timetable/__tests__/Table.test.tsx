import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Table from '../Table';
import { getTimetablesByDepartment, getCoursesByDepartment } from '../../../services/api';

// Mock the modules
jest.mock('../../../services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: '?dept=cs'
  })
}));

const mockTimetables = [
  {
    _id: '1',
    courseId: {
      _id: '1',
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      department: 'cs',
      credits: 4,
      professor: 'Dr. Smith',
      students: 50
    },
    slots: [
      {
        _id: 'slot1',
        day: 'Monday',
        startTime: '9 AM',
        endTime: '10 AM',
        roomNumber: 'NC101'
      }
    ],
    semester: 'Fall',
    year: 2023,
    department: 'cs'
  }
];

const mockCourses = [
  {
    _id: '1',
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    department: 'cs',
    credits: 4,
    professor: 'Dr. Smith',
    students: 50
  }
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Table Component', () => {
  beforeEach(() => {
    (getTimetablesByDepartment as jest.Mock).mockResolvedValue(mockTimetables);
    (getCoursesByDepartment as jest.Mock).mockResolvedValue(mockCourses);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithRouter(<Table />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays timetable after data loads', async () => {
    renderWithRouter(<Table />);
    
    await waitFor(() => {
      expect(getTimetablesByDepartment).toHaveBeenCalledWith('cs');
    });
    
    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });
  });

  it('handles empty timetables gracefully', async () => {
    (getTimetablesByDepartment as jest.Mock).mockResolvedValue([]);
    
    renderWithRouter(<Table />);
    
    await waitFor(() => {
      expect(getTimetablesByDepartment).toHaveBeenCalledWith('cs');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getByText('8 AM')).toBeInTheDocument();
    });
  });
});
