import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Snackbar,
  Alert,
  ButtonGroup,
} from '@mui/material';
import { 
  getCoursesByDepartment, 
  getTimetablesByDepartment,
  generateTimetables,
  Course, 
  TimeSlot 
} from '../../services/api';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import RoomIcon from '@mui/icons-material/Room';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { generatePDF } from '../../utils/pdfUtils';

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
  
  // Memoize static data to prevent unnecessary re-renders
  const timeHeaders = useMemo(() => ['8 AM - 9 AM','9 AM - 10 AM','10 AM - 11 AM','11 AM - 12 PM','12 PM - 1 PM','2 PM - 3 PM','3 PM - 4 PM','4 PM - 5 PM','5 PM - 6 PM'], []);
  const days = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);
  const def = useMemo(() => ['Days', ...timeHeaders], [timeHeaders]);
  
  // Create initial empty state for each day's slots with proper type - memoized to avoid recreating on each render
  const initialGrid = useMemo(() => ({
    Monday: ['Monday', '', '', '', '', '', '', '', '', ''],
    Tuesday: ['Tuesday', '', '', '', '', '', '', '', '', ''],
    Wednesday: ['Wednesday', '', '', '', '', '', '', '', '', ''],
    Thursday: ['Thursday', '', '', '', '', '', '', '', '', ''],
    Friday: ['Friday', '', '', '', '', '', '', '', '', ''],
    Saturday: ['Saturday', '', '', '', '', '', '', '', '', '']
  }), []);
  
  const [grid, setGrid] = useState<Record<string, string[]>>(initialGrid);
  const [cellDetails, setCellDetails] = useState<{[key: string]: CellInfo}>({});
  const [continuousBlocks, setContinuousBlocks] = useState<ContinuousBlock[]>([]);

  // Add a ref to the timetable element for PDF generation
  const timetableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Helper function to get slot index from time string - memoized to improve performance
  const getTimeSlotIndex = useCallback((timeStr: string) => {
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
  }, []);

  // Process timetable data and identify continuous blocks
  const processTimeTables = useCallback((timetablesData: TimetableWithPopulatedCourse[]) => {
    const newGrid = { ...initialGrid };
    const newCellDetails: {[key: string]: CellInfo} = {};
    const blocks: ContinuousBlock[] = [];
    
    const courseSlotsMap: Record<string, {day: string, slot: number, details: CellInfo}[]> = {};
    
    timetablesData.forEach((timetable: TimetableWithPopulatedCourse) => {
      if (codeParam && timetable.courseId.courseCode !== codeParam) {
        return;
      }
      
      const courseKey = `${timetable.courseId._id}-${timetable.courseId.courseCode}`;
      
      if (!courseSlotsMap[courseKey]) {
        courseSlotsMap[courseKey] = [];
      }
      
      timetable.slots.forEach(slot => {
        const { day, startTime, endTime, roomNumber } = slot;
        const slotIndex = getTimeSlotIndex(startTime);
        
        if (slotIndex === -1) return;
        
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
    
    Object.keys(courseSlotsMap).forEach(courseKey => {
      const dayGroups: Record<string, number[]> = {};
      
      courseSlotsMap[courseKey].forEach(slotInfo => {
        if (!dayGroups[slotInfo.day]) {
          dayGroups[slotInfo.day] = [];
        }
        dayGroups[slotInfo.day].push(slotInfo.slot);
      });
      
      Object.keys(dayGroups).forEach(day => {
        const slots = dayGroups[day].sort((a, b) => a - b);
        let currentBlock: number[] = [slots[0]];
        
        for (let i = 1; i < slots.length; i++) {
          if (slots[i] === currentBlock[currentBlock.length - 1] + 1) {
            currentBlock.push(slots[i]);
          } else {
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
            currentBlock = [slots[i]];
          }
        }
        
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
    
    timetablesData.forEach((timetable: TimetableWithPopulatedCourse) => {
      if (codeParam && timetable.courseId.courseCode !== codeParam) {
        return;
      }
      
      timetable.slots.forEach(slot => {
        const { day, startTime } = slot;
        const slotIndex = getTimeSlotIndex(startTime);
        
        if (slotIndex === -1) return;
        
        const cellKey = `${day}-${slotIndex}`;
        
        newCellDetails[cellKey] = {
          courseCode: timetable.courseId.courseCode,
          professor: timetable.courseId.professor,
          roomNumber: slot.roomNumber
        };
        
        if (day in newGrid) {
          newGrid[day as keyof typeof newGrid][slotIndex] = timetable.courseId.courseCode;
        }
      });
    });
    
    setGrid(newGrid);
    setCellDetails(newCellDetails);
    setContinuousBlocks(blocks);
  }, [codeParam, timeHeaders, initialGrid]);

  // Fetch timetables and courses for the department
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!deptParam) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const [coursesData, timetablesData] = await Promise.all([
          getCoursesByDepartment(deptParam),
          getTimetablesByDepartment(deptParam)
        ]);
        
        if (!isMounted) return;
        
        setCourses(coursesData);
        
        const processedTimetables = timetablesData.map((tt: TimetableWithPopulatedCourse) => {
          const courseData = typeof tt.courseId === 'string' 
            ? coursesData.find((c: CourseData) => String(c._id) === String(tt.courseId))
            : tt.courseId;
            
          return {
            ...tt,
            courseId: courseData
          };
        });
        
        setTimetables(processedTimetables);
        
        if (codeParam) {
          const course = coursesData.find((c: CourseData) => c.courseCode === codeParam);
          if (course) {
            setCourseData(course);
          }
        }
        
        processTimeTables(processedTimetables);
        
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching data:', err);
        setError('Failed to load timetable data. Please try again.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [deptParam, codeParam, processTimeTables]);

  const handleGenerateTimetables = async () => {
    if (!deptParam) return;
    
    try {
      setIsGenerating(true);
      
      await Promise.all(timetables.map(tt => 
        fetch(`${process.env.REACT_APP_API_URL}/timetables/${tt._id}`, { method: 'DELETE' })
      ));

      const result = await generateTimetables({
        department: deptParam,
        semester: 'Fall',
        year: new Date().getFullYear(),
        regenerate: true
      });
      
      const updatedTimetables = await getTimetablesByDepartment(deptParam);
      const processedTimetables = updatedTimetables.map((tt: TimetableWithPopulatedCourse) => {
        const courseData = typeof tt.courseId === 'string' 
          ? courses.find((c) => String(c._id) === String(tt.courseId))
          : tt.courseId;
          
        return {
          ...tt,
          courseId: courseData
        };
      });
      
      setTimetables(processedTimetables);
      processTimeTables(processedTimetables);
      
      setSnackbarMessage('Successfully regenerated timetable with new slot allocations');
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

  const handleDownloadPDF = async () => {
    if (!timetableRef.current) return;
    
    try {
      setIsGeneratingPDF(true);
      
      let filename = 'schedulr-timetable.pdf';
      if (codeParam) {
        filename = `schedulr-${codeParam}-timetable.pdf`;
      } else if (deptParam) {
        filename = `schedulr-${deptParam}-timetable.pdf`;
      }
      
      await generatePDF(timetableRef.current, filename);
      
      setSnackbarMessage('Timetable PDF downloaded successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbarMessage('Failed to generate PDF. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const rowsData = useMemo(() => [
    def,
    grid.Monday,
    grid.Tuesday,
    grid.Wednesday,
    grid.Thursday,
    grid.Friday,
    grid.Saturday
  ], [def, grid]);

  const renderCellContent = useCallback((content: string, rowIndex: number, colIndex: number) => {
    if (rowIndex === 0 || colIndex === 0) {
      if (rowIndex === 0 && colIndex > 0) {
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
    
    if (!content) return '';
    
    const day = days[rowIndex - 1];
    const cellKey = `${day}-${colIndex}`;
    const details = cellDetails[cellKey];
    
    const block = continuousBlocks.find(b => 
      b.day === day && 
      colIndex >= b.startSlot && 
      colIndex <= b.endSlot
    );
    
    if (block && colIndex > block.startSlot) {
      return { type: 'PHANTOM_CELL' as const, courseCode: content };
    }
    
    if (!details) return content;
    
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
  }, [days, cellDetails, continuousBlocks, timeHeaders]);

  const deptName = useMemo(() => {
    return departments.find(d => d.id === deptParam)?.name || deptParam?.toUpperCase() || '';
  }, [deptParam]);

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

  return (
    <div className="table-container">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 10 }}>
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
              <ButtonGroup variant="contained" sx={{ mt: 2 }}>
                <Button 
                  color="primary"
                  onClick={handleGenerateTimetables}
                  disabled={isGenerating}
                  startIcon={<CalendarMonthIcon />}
                  sx={{ 
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }}
                >
                  {isGenerating ? (
                    <>
                      <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                      Regenerating...
                    </>
                  ) : 'Regenerate Timetable'}
                </Button>
                
                <Button
                  color="secondary"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  startIcon={isGeneratingPDF ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  sx={{ 
                    bgcolor: 'secondary.main',
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                    }
                  }}
                >
                  {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                </Button>
              </ButtonGroup>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This will create a new timetable with different time slots for all courses.
              </Typography>
            </Box>
          )}
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: '12px', 
            overflow: 'hidden',
            mb: 5,
          }}
        >
          <Box sx={{ overflowX: 'auto', minWidth: '100%' }}>
            <div className="timetable-container" ref={timetableRef}>
              <h2 className='heading'>
                {codeParam 
                  ? `${codeParam} - ${courseData?.courseName || ''} Timetable` 
                  : `${deptName} Department Timetable Schedule`}
              </h2>
              {rowsData.map((rowData, index) => (
                <Cell 
                  key={index} 
                  items={rowData}
                  className={index === 0 ? "toprow" : ""}
                  rowIndex={index}
                  renderContent={(content, colIndex) => renderCellContent(content, index, colIndex)}
                />
              ))}
            </div>
          </Box>
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

export default React.memo(Table);
