import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Table.css';
import Cell from './Cell';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  CircularProgress, 
  Button,
  Grid,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import { 
  getCoursesByDepartment, 
  getTimetablesByDepartment,
  generateTimetables,
  Course, 
  Timetable,
  TimeSlot 
} from '../../services/api';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import RoomIcon from '@mui/icons-material/Room';

interface CourseData extends Course {
  _id: string;
}

// Define a separate interface for timetables with populated course data
interface TimetableWithPopulatedCourse {
  _id: string;
  courseId: CourseData;
  slots: TimeSlot[];
  semester: string;
  year: number;
  department: string;
}

interface CellInfo {
  courseCode: string;
  professor: string;
  roomNumber: string;
}

const Table: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const deptParam = searchParams.get('dept');
  const codeParam = searchParams.get('code');
  
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [timetables, setTimetables] = useState<TimetableWithPopulatedCourse[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  // Initialize timetable grid
  const timeHeaders = ['8 AM - 9 AM','9 AM - 10 AM','10 AM - 11 AM','11 AM - 12 PM','12 PM - 1 PM','2 PM - 3 PM','3 PM - 4 PM','4 PM - 5 PM','5 PM - 6 PM'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const def = ['Days', ...timeHeaders];
  
  // Create initial empty state for each day's slots with proper type
  const [grid, setGrid] = useState<Record<string, string[]>>({
    Monday: ['Monday', '', '', '', '', '', '', '', '', ''],
    Tuesday: ['Tuesday', '', '', '', '', '', '', '', '', ''],
    Wednesday: ['Wednesday', '', '', '', '', '', '', '', '', ''],
    Thursday: ['Thursday', '', '', '', '', '', '', '', '', ''],
    Friday: ['Friday', '', '', '', '', '', '', '', '', ''],
    Saturday: ['Saturday', '', '', '', '', '', '', '', '', '']
  });

  // Map to store detailed info for each cell
  const [cellDetails, setCellDetails] = useState<{[key: string]: CellInfo}>({});

  // Helper function to get slot index from time string
  const getTimeSlotIndex = (timeStr: string) => {
    const timeMap: { [key: string]: number } = {
      '8 AM': 1,
      '9 AM': 2,
      '10 AM': 3,
      '11 AM': 4,
      '12 PM': 5,
      '2 PM': 6,
      '3 PM': 7,
      '4 PM': 8,
      '5 PM': 9
    };
    return timeMap[timeStr] || -1;
  };

  // Fetch timetables and courses for the department
  useEffect(() => {
    const fetchData = async () => {
      if (!deptParam) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch courses and timetables for the department
        const [coursesData, timetablesData] = await Promise.all([
          getCoursesByDepartment(deptParam),
          getTimetablesByDepartment(deptParam)
        ]);
        
        setCourses(coursesData);
        
        // Process the timetable data to ensure courseId is populated
        const processedTimetables: TimetableWithPopulatedCourse[] = timetablesData.map((tt: any) => {
          // Handle both populated and unpopulated courseId
          const courseData = typeof tt.courseId === 'string' 
            ? coursesData.find((c: CourseData) => c._id === tt.courseId)
            : tt.courseId;
            
          return {
            ...tt,
            courseId: courseData
          };
        });
        
        setTimetables(processedTimetables);
        
        // If course code is specified, find that specific course
        if (codeParam) {
          const course = coursesData.find((c: CourseData) => c.courseCode === codeParam);
          if (course) {
            setCourseData(course);
          }
        }
        
        // Process timetable data to populate the grid
        processTimeTables(processedTimetables);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load timetable data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [deptParam, codeParam]);

  // Process timetable data and update the grid
  const processTimeTables = (timetablesData: TimetableWithPopulatedCourse[]) => {
    // Create new grid with empty slots
    const newGrid: Record<string, string[]> = {
      Monday: ['Monday', '', '', '', '', '', '', '', '', ''],
      Tuesday: ['Tuesday', '', '', '', '', '', '', '', '', ''],
      Wednesday: ['Wednesday', '', '', '', '', '', '', '', '', ''],
      Thursday: ['Thursday', '', '', '', '', '', '', '', '', ''],
      Friday: ['Friday', '', '', '', '', '', '', '', '', ''],
      Saturday: ['Saturday', '', '', '', '', '', '', '', '', '']
    };
    
    // Create new cell details map
    const newCellDetails: {[key: string]: CellInfo} = {};
    
    timetablesData.forEach(timetable => {
      // Skip processing if we have a specific course filter and this is not that course
      if (codeParam && timetable.courseId.courseCode !== codeParam) {
        return;
      }
      
      // Process each slot in the timetable
      timetable.slots.forEach(slot => {
        const { day, startTime, endTime, roomNumber } = slot;
        const slotIndex = getTimeSlotIndex(startTime);
        
        if (slotIndex === -1) return;
        
        // Create a unique key for this cell
        const cellKey = `${day}-${slotIndex}`;
        
        // Store full details for tooltip/popup
        newCellDetails[cellKey] = {
          courseCode: timetable.courseId.courseCode,
          professor: timetable.courseId.professor,
          roomNumber: roomNumber
        };
        
        // Update the grid with course code (visible text)
        // Only process days that exist in our grid
        if (day in newGrid) {
          newGrid[day][slotIndex] = timetable.courseId.courseCode;
        }
      });
    });
    
    // Update state
    setGrid(newGrid);
    setCellDetails(newCellDetails);
  };

  // Handle timetable generation
  const handleGenerateTimetables = async () => {
    if (!deptParam) return;
    
    try {
      setIsGenerating(true);
      
      // Call the API to generate timetables
      const result = await generateTimetables({
        department: deptParam,
        semester: 'Fall',
        year: new Date().getFullYear()
      });
      
      // Refresh the timetables
      const updatedTimetables = await getTimetablesByDepartment(deptParam);
      
      // Process the updated timetables
      const processedTimetables: TimetableWithPopulatedCourse[] = updatedTimetables.map((tt: any) => {
        const courseData = typeof tt.courseId === 'string' 
          ? courses.find((c: CourseData) => c._id === tt.courseId)
          : tt.courseId;
          
        return {
          ...tt,
          courseId: courseData
        };
      });
      
      setTimetables(processedTimetables);
      processTimeTables(processedTimetables);
      
      // Show success message
      setSnackbarMessage(`Successfully generated timetables for ${result.timetables.length} courses`);
      setSnackbarOpen(true);
      
    } catch (err) {
      console.error('Error generating timetables:', err);
      setError('Failed to generate timetables. Please try again.');
      setSnackbarMessage('Failed to generate timetables');
      setSnackbarOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Create array of all row data for the Cell component
  const getRowsData = () => {
    return [
      def,
      grid.Monday,
      grid.Tuesday,
      grid.Wednesday,
      grid.Thursday,
      grid.Friday,
      grid.Saturday
    ];
  };

  // Custom component for showing cell with course details
  const renderCellContent = (content: string, rowIndex: number, colIndex: number) => {
    // Return plain content for header row and first column
    if (rowIndex === 0 || colIndex === 0) return content;
    
    // If cell is empty, return empty string
    if (!content) return '';
    
    // Get day based on row index
    const day = days[rowIndex - 1];
    const cellKey = `${day}-${colIndex}`;
    const details = cellDetails[cellKey];
    
    if (!details) return content;
    
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>{content}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon fontSize="small" />
            <Typography variant="body2">{details.professor}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <RoomIcon fontSize="small" />
            <Typography variant="body2">{details.roomNumber}</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, bgcolor: 'error.dark', color: 'white' }}>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  const deptName = departments.find(d => d.id === deptParam)?.name || deptParam?.toUpperCase() || '';

  return (
    <div className="table-container">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {codeParam ? `Timetable for ${codeParam}` : `${deptName} Department Timetable`}
          </Typography>
          
          {courseData && (
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h5" component="h2">
                {courseData.courseName} ({courseData.courseCode})
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <Typography variant="body1">
                  <strong>Department:</strong> {courseData.department.toUpperCase()}
                </Typography>
                <Typography variant="body1">
                  <strong>Credits:</strong> {courseData.credits}
                </Typography>
                <Typography variant="body1">
                  <strong>Professor:</strong> {courseData.professor}
                </Typography>
                <Typography variant="body1">
                  <strong>Students:</strong> {courseData.students}
                </Typography>
              </Box>
            </Paper>
          )}
          
          {!codeParam && deptParam && courses.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Button 
                variant="contained"
                color="primary"
                onClick={handleGenerateTimetables}
                disabled={isGenerating}
                sx={{ mt: 2 }}
              >
                {isGenerating ? 'Generating...' : 'Generate Department Timetable'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This will create a new timetable for all courses in this department.
              </Typography>
            </Box>
          )}
        </Box>

        <div className="container">
          <h2 className='heading'>TimeTable</h2>
          {getRowsData().map((rowData, index) => (
            <Cell 
              key={index} 
              items={rowData}
              className={index === 0 ? "toprow" : ""}
              renderContent={(content, colIndex) => renderCellContent(content, index, colIndex)}
            />
          ))}
        </div>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={error ? "error" : "success"}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

// Import department data
const departments = [
  { id: 'all', name: 'All Departments' },
  { id: 'cs', name: 'Computer Science' },
  { id: 'mnc', name: 'Mathematics & Computing' },
  { id: 'ee', name: 'Electrical Engineering' },
  { id: 'me', name: 'Mechanical Engineering' },
  { id: 'ce', name: 'Civil Engineering' }
];

export default Table;
