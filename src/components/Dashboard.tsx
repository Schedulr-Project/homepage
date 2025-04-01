import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  Fab,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';
import { getCourses, getCoursesByDepartment, Course } from '../services/api';

const departments = [
  { id: 'all', name: 'All Departments' },
  { id: 'cs', name: 'Computer Science' },
  { id: 'mnc', name: 'Mathematics & Computing' },
  { id: 'ee', name: 'Electrical Engineering' },
  { id: 'me', name: 'Mechanical Engineering' },
  { id: 'ce', name: 'Civil Engineering' }
];

interface CourseData extends Course {
  _id: string;
}

const DepartmentBlock: React.FC<{ name: string, onClick: () => void }> = ({ name, onClick }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        }
      }}
    >
      <CardActionArea 
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        onClick={onClick}
      >
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarMonthIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" component="div" align="center">
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            View timetable
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  </Grid>
);

const CourseBlock: React.FC<{ course: CourseData, onClick: () => void }> = ({ course, onClick }) => {
  // Find department name
  const deptName = departments.find(d => d.id === course.department)?.name || course.department;
  
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          }
        }}
      >
        <CardActionArea 
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
          onClick={onClick}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" component="div">
                {course.courseCode}
              </Typography>
            </Box>
            
            <Typography variant="subtitle1" component="div" align="center" gutterBottom>
              {course.courseName}
            </Typography>
            
            <Divider sx={{ my: 1.5 }} />
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              <strong>Department:</strong> {deptName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              <strong>Professor:</strong> {course.professor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Credits:</strong> {course.credits}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [department, setDepartment] = useState('all');
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse department from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deptParam = params.get('dept');
    if (deptParam) {
      setDepartment(deptParam);
    }
  }, [location]);

  // Load courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        let fetchedCourses;
        if (department === 'all') {
          fetchedCourses = await getCourses();
        } else {
          fetchedCourses = await getCoursesByDepartment(department);
        }
        setCourses(fetchedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [department]);

  const handleChange = (event: SelectChangeEvent) => {
    setDepartment(event.target.value);
  };

  const handleViewTimetable = (deptId = department) => {
    navigate(`/generator?dept=${deptId}`);
  };

  const handleEditTimetable = (deptId = department) => {
    navigate(`/edit-timetable?dept=${deptId}`);
  };

  const handleViewCourse = (courseId: string) => {
    const course = courses.find(c => c._id === courseId);
    if (course) {
      navigate(`/generator?dept=${course.department}&code=${course.courseCode}`);
    }
  };

  const handleCreateNew = () => {
    navigate('/create');
  };

  // Filter departments and courses to display based on selection
  const departmentsToShow = department === 'all' 
    ? departments.filter(dept => dept.id !== 'all')
    : departments.filter(dept => dept.id === department);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8, position: 'relative' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Department Timetables
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Select a department to view its timetable or browse all available timetables below.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 6 }}>
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel id="department-select-label">Department</InputLabel>
          <Select
            labelId="department-select-label"
            id="department-select"
            value={department}
            label="Department"
            onChange={handleChange}
          >
            {departments.map(dept => (
              <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => handleViewTimetable()}
          startIcon={<ViewListIcon />}
          sx={{ height: 'fit-content' }}
        >
          View Timetable
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => handleEditTimetable()}
          startIcon={<EditIcon />}
          sx={{ height: 'fit-content' }}
        >
          Edit Timetable
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ my: 4, p: 2, bgcolor: 'error.dark', color: 'white', borderRadius: 2 }}>
          <Typography>{error}</Typography>
        </Box>
      ) : (
        <>
          {departmentsToShow.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {department === 'all' ? 'All Departments' : 'Selected Department'}
              </Typography>
              <Grid container spacing={3} sx={{ mt: 2, mb: 6 }}>
                {departmentsToShow.map(dept => (
                  <DepartmentBlock 
                    key={dept.id} 
                    name={dept.name} 
                    onClick={() => handleViewTimetable(dept.id)}
                  />
                ))}
              </Grid>
            </Box>
          )}

          {courses.length > 0 ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {department === 'all' ? 'All Courses' : 'Department Courses'}
              </Typography>
              <Grid container spacing={3} sx={{ mt: 2 }}>
                {courses.map(course => (
                  <CourseBlock 
                    key={course._id} 
                    course={course} 
                    onClick={() => handleViewCourse(course._id)}
                  />
                ))}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ mt: 4, p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No courses found. Create a new course to get started.
              </Typography>
            </Box>
          )}
        </>
      )}
      
      {/* Floating action button to create new timetable */}
      <Tooltip title="Create New Timetable">
        <Fab 
          color="primary" 
          aria-label="add"
          sx={{ 
            position: 'fixed', 
            bottom: 84,
            right: 24,
          }}
          onClick={handleCreateNew}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Container>
  );
};

export default Dashboard;
