import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../timetable/Table.css';
import Cell from '../timetable/Cell';
import CourseEditModal from './CourseEditModal';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  CircularProgress, 
  Button,
  Alert,
  Snackbar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { 
  getCoursesByDepartment, 
  getTimetablesByDepartment,
  Course, 
  Timetable,
  TimeSlot,
  updateTimetableSlot,
  getClassrooms,
  Classroom,
  checkSlotAvailability,
  deleteTimetableSlot,
  getCourses
} from '../../services/api';
import PersonIcon from '@mui/icons-material/Person';
import RoomIcon from '@mui/icons-material/Room';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

interface CourseData extends Course {
  _id: string;
}

// Timetables with populated course data
interface TimetableWithPopulatedCourse {
  _id: string;
  courseId: CourseData;
  slots: TimeSlot[];
  semester: string;
  year: number;
  department: string;
}

interface CellInfo {
  timetableId: string;
  slotId?: string;  // The database ID of the specific slot
  courseCode: string;
  professor: string;
  roomNumber: string;
  courseId: string;
}

interface EditModalData {
  isOpen: boolean;
  day: string;
  timeSlot: number;
  slotDetails: CellInfo | null;
  isNewSlot: boolean;
}

const EditTimetable: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const deptParam = searchParams.get('dept');
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>(deptParam || 'all');
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [timetables, setTimetables] = useState<TimetableWithPopulatedCourse[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Modal state for editing
  const [editModal, setEditModal] = useState<EditModalData>({
    isOpen: false,
    day: '',
    timeSlot: -1,
    slotDetails: null,
    isNewSlot: false
  });
  
  // Initialize timetable grid
  const timeHeaders = ['8 AM - 9 AM','9 AM - 10 AM','10 AM - 11 AM','11 AM - 12 PM','12 PM - 1 PM','2 PM - 3 PM','3 PM - 4 PM','4 PM - 5 PM','5 PM - 6 PM'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const def = ['Days', ...timeHeaders];
  
  // Create initial empty state for each day's slots
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

  // Helper to get time string from slot index
  const getTimeFromIndex = (index: number): string => {
    const times = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    return times[index - 1] || '';
  };

  // Fetch timetables, courses, and classrooms for the department
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        let coursesData: Course[] = []; // Explicitly type as an array of Course
        let timetablesData: Timetable[] = []; // Explicitly type as an array of Timetable
        
        if (selectedDepartment === 'all') {
          // Fetch data for all departments
          coursesData = await getCourses();
          const allTimetables: Timetable[] = [];
          
          // Fetch timetables for each department
          for (const dept of departments) {
            if (dept.id !== 'all') {
              const deptTimetables = await getTimetablesByDepartment(dept.id);
              allTimetables.push(...deptTimetables);
            }
          }
          timetablesData = allTimetables;
        } else {
          // Fetch data for specific department
          coursesData = await getCoursesByDepartment(selectedDepartment);
          timetablesData = await getTimetablesByDepartment(selectedDepartment);
        }
        
        // Fetch classrooms regardless of department
        const classroomsData = await getClassrooms();
        
        // Map Course[] to CourseData[] and filter out any courses without an _id
        const validCoursesData: CourseData[] = coursesData
          .filter((course): course is Course & { _id: string } => course._id !== undefined)
          .map(course => ({ ...course, _id: course._id! }));
          
        setCourses(validCoursesData);
        setClassrooms(classroomsData);
        
        // Process the timetable data to ensure courseId is populated
        const processedTimetables: TimetableWithPopulatedCourse[] = timetablesData.map((tt: any) => {
          // Handle both populated and unpopulated courseId
          const courseData = typeof tt.courseId === 'string' 
            ? coursesData.find((c: Course) => c._id === tt.courseId)
            : tt.courseId;
            
          return {
            ...tt,
            courseId: courseData
          };
        });
        
        setTimetables(processedTimetables);
        processTimeTables(processedTimetables);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load timetable data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartment]);

  // Process timetable data
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
    
    // Process timetables to populate the grid
    timetablesData.forEach(timetable => {
      timetable.slots.forEach((slot, slotIndex) => {
        const { day, startTime } = slot;
        const slotPosition = getTimeSlotIndex(startTime);
        
        if (slotPosition === -1) return;
        
        // Create a unique key for this cell
        const cellKey = `${day}-${slotPosition}`;
        
        // Store full details for this cell
        newCellDetails[cellKey] = {
          timetableId: timetable._id,
          slotId: slot._id, // Store the individual slot ID for direct updates
          courseCode: timetable.courseId.courseCode,
          professor: timetable.courseId.professor,
          roomNumber: slot.roomNumber,
          courseId: timetable.courseId._id
        };
        
        // Update the grid with course code
        if (day in newGrid) {
          newGrid[day][slotPosition] = timetable.courseId.courseCode;
        }
      });
    });
    
    setGrid(newGrid);
    setCellDetails(newCellDetails);
  };

  // Function to handle cell click for editing
  const handleCellClick = (day: string, slotIndex: number) => {
    const cellKey = `${day}-${slotIndex}`;
    const details = cellDetails[cellKey];
    
    // Open modal with current details or empty if it's a new slot
    setEditModal({
      isOpen: true,
      day,
      timeSlot: slotIndex,
      slotDetails: details || null,
      isNewSlot: !details
    });
  };

  // Function to handle saving edited slot
  const handleSaveSlot = async (updatedData: {
    courseId: string, 
    roomNumber: string, 
    day: string,
    startTime: string,
    endTime: string,
    department?: string, // Add department for clash detection
  }) => {
    if (!selectedDepartment || selectedDepartment === 'all') {
      setSnackbarMessage("Please select a specific department to make changes");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setIsSaving(true);
    const { isNewSlot, day, timeSlot, slotDetails } = editModal;
    
    try {
      // Check for availability conflicts first
      const availabilityCheck = await checkSlotAvailability({
        day: updatedData.day,
        startTime: updatedData.startTime,
        roomNumber: updatedData.roomNumber,
        timetableId: isNewSlot ? '' : (slotDetails?.timetableId || ''),
        slotId: isNewSlot ? '' : (slotDetails?.slotId || ''),
        department: selectedDepartment // Pass department for department-level clash detection
      });
      
      if (!availabilityCheck.available) {
        setSnackbarMessage(`Conflict detected: ${availabilityCheck.message}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setIsSaving(false);
        return;
      }
      
      // Update the slot in the database
      await updateTimetableSlot({
        timetableId: isNewSlot ? '' : (slotDetails?.timetableId || ''),
        slotId: isNewSlot ? '' : (slotDetails?.slotId || ''),
        isNewSlot,
        department: selectedDepartment,
        courseId: updatedData.courseId,
        roomNumber: updatedData.roomNumber,
        day: updatedData.day,
        startTime: updatedData.startTime,
        endTime: updatedData.endTime
      });
      
      // Refresh the timetable data
      const refreshedTimetables = await getTimetablesByDepartment(selectedDepartment);
      const processedTimetables = refreshedTimetables.map((tt: any) => {
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
      
      setSnackbarMessage(isNewSlot ? 'Course slot added successfully!' : 'Course slot updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Close the modal
      setEditModal(prev => ({ ...prev, isOpen: false }));
      
    } catch (err) {
      console.error('Error updating slot:', err);
      setSnackbarMessage('Failed to update timetable slot.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedDepartment || selectedDepartment === 'all') {
      setSnackbarMessage("Please select a specific department to make changes");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const { slotDetails } = editModal;
    if (!slotDetails) return;

    setIsSaving(true);

    try {
      // Delete the slot from the database
      await deleteTimetableSlot(slotDetails.timetableId, slotDetails.slotId!);

      // Refresh the timetable data
      const refreshedTimetables = await getTimetablesByDepartment(selectedDepartment);
      const processedTimetables = refreshedTimetables.map((tt: any) => {
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

      setSnackbarMessage('Course slot deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Close the modal
      setEditModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error('Error deleting slot:', err);
      setSnackbarMessage('Failed to delete timetable slot.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setEditModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDepartmentChange = (event: SelectChangeEvent) => {
    const newDept = event.target.value;
    setSelectedDepartment(newDept);
    
    // Update URL to reflect the selected department
    navigate(`/edit-timetable?dept=${newDept}`);
  };

  const getDepartmentName = (id: string) => {
    return departments.find(d => d.id === id)?.name || id?.toUpperCase() || '';
  };

  const deptName = getDepartmentName(selectedDepartment);

  // Render cell content with edit icons for the admin
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
    
    // Get day based on row index
    const day = days[rowIndex - 1];
    const cellKey = `${day}-${colIndex}`;
    const details = cellDetails[cellKey];
    
    // For empty cells, show a placeholder for adding courses
    if (!content) {
      return (
        <Button 
          onClick={() => handleCellClick(day, colIndex)}
          variant="outlined" 
          color="primary"
          size="small"
          sx={{ 
            opacity: 0.7, 
            borderStyle: 'dashed', 
            '&:hover': { 
              opacity: 1, 
              borderStyle: 'solid' 
            } 
          }}
        >
          Add Course
        </Button>
      );
    }
    
    // For cells with courses, show course info with edit icon
    if (details) {
      return (
        <div className="single-hour-cell">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'start',
            width: '100%'
          }}>
            <div className="course-content">
              <div className="course-title">{content}</div>
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
            <Button 
              size="small"
              onClick={() => handleCellClick(day, colIndex)}
              sx={{ minWidth: '30px', height: '30px', mt: -1, mr: -1 }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Box>
        </div>
      );
    }
    
    return content;
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
            Edit {selectedDepartment === 'all' ? 'All Departments' : `${deptName} Department`} Timetable
          </Typography>
          
          <Typography variant="body1" paragraph>
            {selectedDepartment === 'all' 
              ? 'Viewing all departments. Select a specific department to make changes.' 
              : 'Click on any cell to add or edit a course. Changes will be saved immediately and conflict-checked.'}
          </Typography>

          {/* Add Department Selection dropdown */}
          <FormControl sx={{ minWidth: 240, mb: 3 }}>
            <InputLabel id="department-select-label">Department</InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              label="Department"
              onChange={handleDepartmentChange}
            >
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
              onClick={() => navigate(`/generator?dept=${selectedDepartment}`)}
            >
              View Published Timetable
            </Button>
          </Box>
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
            <div className="timetable-container">
              <h2 className='heading'>
                {selectedDepartment === 'all' ? 'All Departments' : `${deptName} Department`} Timetable - Edit Mode
              </h2>
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
          </Box>
        </Paper>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
        
        {/* Modal for editing course slots */}
        <CourseEditModal
          open={editModal.isOpen}
          onClose={handleCloseModal}
          day={editModal.day}
          timeSlot={getTimeFromIndex(editModal.timeSlot)}
          slotDetails={editModal.slotDetails}
          courses={courses}
          classrooms={classrooms}
          isNewSlot={editModal.isNewSlot}
          onSave={handleSaveSlot}
          onDelete={handleDeleteSlot}
          isSaving={isSaving}
          selectedDepartment={selectedDepartment} // Pass the current department
        />
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

export default EditTimetable;
