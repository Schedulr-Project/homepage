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

// Add this new interface to represent continuous blocks
interface ContinuousBlock {
  courseCode: string;
  professor: string;
  roomNumber: string;
  day: string;
  startSlot: number;
  endSlot: number;
  startTime: string;
  endTime: string;
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
  
  // Add a new state to track continuous blocks
  const [continuousBlocks, setContinuousBlocks] = useState<ContinuousBlock[]>([]);

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

  // Process timetable data and identify continuous blocks
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
    
    // Create array to track continuous blocks
    const blocks: ContinuousBlock[] = [];
    
    // First, collect all slot information
    const courseSlotsMap: Record<string, {day: string, slot: number, details: CellInfo}[]> = {};
    
    timetablesData.forEach(timetable => {
      // Skip processing if we have a specific course filter and this is not that course
      if (codeParam && timetable.courseId.courseCode !== codeParam) {
        return;
      }
      
      const courseKey = `${timetable.courseId._id}-${timetable.courseId.courseCode}`;
      
      if (!courseSlotsMap[courseKey]) {
        courseSlotsMap[courseKey] = [];
      }
      
      // Process each slot in the timetable
      timetable.slots.forEach(slot => {
        const { day, startTime, endTime, roomNumber } = slot;
        const slotIndex = getTimeSlotIndex(startTime);
        
        if (slotIndex === -1) return;
        
        // Add this slot to the map
        courseSlotsMap[courseKey].push({
          day,
          slot: slotIndex,
          details: {
            courseCode: timetable.courseId.courseCode,
            professor: timetable.courseId.professor,
            roomNumber
          }
        });
      });
    });
    
    // Now identify continuous blocks for each course
    Object.keys(courseSlotsMap).forEach(courseKey => {
      // Group slots by day
      const dayGroups: Record<string, number[]> = {};
      
      courseSlotsMap[courseKey].forEach(slotInfo => {
        if (!dayGroups[slotInfo.day]) {
          dayGroups[slotInfo.day] = [];
        }
        dayGroups[slotInfo.day].push(slotInfo.slot);
      });
      
      // For each day, find continuous blocks
      Object.keys(dayGroups).forEach(day => {
        const slots = dayGroups[day].sort((a, b) => a - b);
        let currentBlock: number[] = [slots[0]];
        
        for (let i = 1; i < slots.length; i++) {
          // If this slot is consecutive to the previous one
          if (slots[i] === currentBlock[currentBlock.length - 1] + 1) {
            currentBlock.push(slots[i]);
          } else {
            // End the current block and start a new one
            if (currentBlock.length > 0) {
              // Add the completed block
              const sample = courseSlotsMap[courseKey].find(s => s.day === day && s.slot === currentBlock[0]);
              if (sample) {
                blocks.push({
                  courseCode: sample.details.courseCode,
                  professor: sample.details.professor,
                  roomNumber: sample.details.roomNumber,
                  day,
                  startSlot: currentBlock[0],
                  endSlot: currentBlock[currentBlock.length - 1],
                  startTime: timeHeaders[currentBlock[0] - 1],
                  endTime: timeHeaders[currentBlock[currentBlock.length - 1] - 1]
                });
              }
            }
            // Start a new block
            currentBlock = [slots[i]];
          }
        }
        
        // Add the last block if it exists
        if (currentBlock.length > 0) {
          const sample = courseSlotsMap[courseKey].find(s => s.day === day && s.slot === currentBlock[0]);
          if (sample) {
            blocks.push({
              courseCode: sample.details.courseCode,
              professor: sample.details.professor,
              roomNumber: sample.details.roomNumber,
              day,
              startSlot: currentBlock[0],
              endSlot: currentBlock[currentBlock.length - 1],
              startTime: timeHeaders[currentBlock[0] - 1],
              endTime: timeHeaders[currentBlock[currentBlock.length - 1] - 1]
            });
          }
        }
      });
    });
    
    // Now populate the grid and cell details
    timetablesData.forEach(timetable => {
      if (codeParam && timetable.courseId.courseCode !== codeParam) {
        return;
      }
      
      timetable.slots.forEach(slot => {
        const { day, startTime } = slot;
        const slotIndex = getTimeSlotIndex(startTime);
        
        if (slotIndex === -1) return;
        
        // Create a unique key for this cell
        const cellKey = `${day}-${slotIndex}`;
        
        // Store full details for tooltip/popup
        newCellDetails[cellKey] = {
          courseCode: timetable.courseId.courseCode,
          professor: timetable.courseId.professor,
          roomNumber: slot.roomNumber
        };
        
        // Update the grid with course code (visible text)
        if (day in newGrid) {
          newGrid[day][slotIndex] = timetable.courseId.courseCode;
        }
      });
    });
    
    // Update state
    setGrid(newGrid);
    setCellDetails(newCellDetails);
    setContinuousBlocks(blocks);
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
    if (rowIndex === 0 || colIndex === 0) {
      if (rowIndex === 0 && colIndex > 0) {
        // Better formatting for time slot headers
        const timeSlot = content.split(' - ');
        return (
          <>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{timeSlot[0]}</div>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>to</div>
            <div style={{ fontSize: '14px' }}>{timeSlot[1]}</div>
          </>
        );
      }
      return content;
    }
    
    // If cell is empty, return empty string
    if (!content) return '';
    
    // Get day based on row index
    const day = days[rowIndex - 1];
    const cellKey = `${day}-${colIndex}`;
    const details = cellDetails[cellKey];
    
    // Check if this cell is part of a continuous block
    const block = continuousBlocks.find(b => 
      b.day === day && 
      colIndex >= b.startSlot && 
      colIndex <= b.endSlot
    );
    
    // Only render the content for the first cell in a continuous block
    if (block && colIndex > block.startSlot) {
      return { type: 'PHANTOM_CELL' as const, courseCode: content };
    }
    
    if (!details) return content;
    
    // If this is the first cell of a continuous block, show duration info
    const isMultiHour = block && (block.endSlot > block.startSlot);
    const blockLength = block ? block.endSlot - block.startSlot + 1 : 1;
    
    return (
      <div 
        className={isMultiHour ? "multi-hour-cell" : "single-hour-cell"}
        data-span={isMultiHour ? blockLength : 1}
      >
        <div className="course-content">
          <div className="course-title">{content}</div>
          {isMultiHour && (
            <div className="course-time">
              {block?.startTime.split(' - ')[0]} - {block?.endTime.split(' - ')[1]}
            </div>
          )}
          <div className="course-details">
            <div className="professor">
              <PersonIcon fontSize="small" />
              <span>{details.professor}</span>
            </div>
            <div className="room">
              <RoomIcon fontSize="small" />
              <span>{details.roomNumber}</span>
            </div>
          </div>
        </div>
      </div>
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
          <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
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

        <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="timetable-container">
            <h2 className='heading'>Timetable Schedule</h2>
            {getRowsData().map((rowData, index) => (
              <Cell 
                key={index} 
                items={rowData}
                className={index === 0 ? "toprow" : ""}
                rowIndex={index}
                renderContent={(content, colIndex) => renderCellContent(content, index, colIndex)}
              />
            ))}
          </div>
        </Paper>
        
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
