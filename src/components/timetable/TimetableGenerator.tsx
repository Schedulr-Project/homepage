import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormHelperText,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// Same departments as in Dashboard for consistency
const departments = [
  { id: 'cs', name: 'Computer Science' },
  { id: 'mnc', name: 'Mathematics & Computing' },
  { id: 'ee', name: 'Electrical Engineering' },
  { id: 'me', name: 'Mechanical Engineering' },
  { id: 'ce', name: 'Civil Engineering' }
];

interface CourseInfo {
  courseCode: string;
  courseName: string;
  credits: number;
  professor: string;
}

interface FormData {
  department: string;
  courseCount: number;
  courses: CourseInfo[];
}

// New interface for form validation errors
interface FormErrors {
  department?: string;
  courseCount?: string;
  courses?: { [index: number]: {
    courseCode?: string;
    courseName?: string;
    credits?: string;
    professor?: string;
  }}
}

const initialCourseInfo: CourseInfo = {
  courseCode: '',
  courseName: '',
  credits: 3,
  professor: ''
};

const initialFormData: FormData = {
  department: '',
  courseCount: 1,
  courses: [{ ...initialCourseInfo }]
};

const TimetableGenerator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  // Update courses array whenever courseCount changes
  useEffect(() => {
    const newCourses = [...formData.courses];
    const currentLength = newCourses.length;
    const targetLength = formData.courseCount;

    if (currentLength < targetLength) {
      // Add more courses
      for (let i = currentLength; i < targetLength; i++) {
        newCourses.push({ ...initialCourseInfo });
      }
    } else if (currentLength > targetLength) {
      // Remove extra courses
      newCourses.splice(targetLength);
    }

    setFormData(prev => ({
      ...prev,
      courses: newCourses
    }));
  }, [formData.courseCount]);

  const handleDepartmentChange = (e: SelectChangeEvent) => {
    setFormData({
      ...formData,
      department: e.target.value
    });
    
    if (errors.department) {
      setErrors({
        ...errors,
        department: undefined
      });
    }
  };

  const handleCourseCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const courseCount = Math.min(Math.max(value, 1), 10); // Limit between 1-10 courses
    
    setFormData({
      ...formData,
      courseCount: courseCount
    });
    
    if (errors.courseCount) {
      setErrors({
        ...errors,
        courseCount: undefined
      });
    }
  };

  const handleCourseFieldChange = (
    index: number, 
    field: keyof CourseInfo, 
    value: string | number
  ) => {
    const newCourses = [...formData.courses];
    
    if (field === 'credits') {
      newCourses[index] = {
        ...newCourses[index],
        [field]: parseInt(value as string) || 0
      };
    } else {
      newCourses[index] = {
        ...newCourses[index],
        [field]: value
      };
    }
    
    setFormData({
      ...formData,
      courses: newCourses
    });
    
    // Clear error for this field if exists
    if (errors.courses && errors.courses[index] && errors.courses[index][field]) {
      const newErrors = { ...errors };
      if (newErrors.courses && newErrors.courses[index]) {
        newErrors.courses[index] = {
          ...newErrors.courses[index],
          [field]: undefined
        };
      }
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    // Create a new errors object with type safety
    const newErrors: FormErrors = {};
    let hasError = false;
    
    if (!formData.department) {
      newErrors.department = "Department is required";
      hasError = true;
    }
    
    if (formData.courseCount <= 0) {
      newErrors.courseCount = "At least one course is required";
      hasError = true;
    }
    
    // Create a courses errors object only if we find errors
    const coursesErrors: { [index: number]: any } = {};
    
    formData.courses.forEach((course, index) => {
      const courseErrors: {
        courseCode?: string;
        courseName?: string;
        credits?: string;
        professor?: string;
      } = {};
      
      if (!course.courseCode) {
        courseErrors.courseCode = "Course code is required";
        hasError = true;
      }
      
      if (!course.courseName) {
        courseErrors.courseName = "Course name is required";
        hasError = true;
      }
      
      if (course.credits <= 0) {
        courseErrors.credits = "Credits must be greater than 0";
        hasError = true;
      }
      
      if (!course.professor) {
        courseErrors.professor = "Professor name is required";
        hasError = true;
      }
      
      if (Object.keys(courseErrors).length > 0) {
        coursesErrors[index] = courseErrors;
      }
    });
    
    // Only add the courses errors property if we found errors
    if (Object.keys(coursesErrors).length > 0) {
      newErrors.courses = coursesErrors;
    }
    
    setErrors(newErrors);
    return !hasError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Save all courses to localStorage
      const savedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      
      // Add each course with department info and unique ID
      formData.courses.forEach(course => {
        savedCourses.push({
          id: Date.now() + Math.random(), // Ensure unique ID
          department: formData.department,
          ...course
        });
      });
      
      localStorage.setItem('courses', JSON.stringify(savedCourses));
      
      setSnackbarOpen(true);
      
      // Redirect to dashboard to see all courses
      setTimeout(() => {
        navigate(`/dashboard?dept=${formData.department}`);
      }, 1500);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        Timetable Generator
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" paragraph sx={{ mb: 4 }}>
        Fill in the course details to generate timetables
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Department Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.department}>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  label="Department"
                  onChange={handleDepartmentChange}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
                {errors.department && (
                  <FormHelperText>{errors.department}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Number of Courses */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Courses"
                name="courseCount"
                type="number"
                value={formData.courseCount}
                onChange={handleCourseCountChange}
                InputProps={{ 
                  inputProps: { min: 1, max: 10 } 
                }}
                error={!!errors.courseCount}
                helperText={errors.courseCount || "Maximum 10 courses"}
              />
            </Grid>
          </Grid>
          
          {/* Course Fields - Dynamically Generated */}
          {formData.courses.map((course, index) => (
            <Box key={index} sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Divider sx={{ flexGrow: 1, mr: 2 }} />
                <Typography variant="h6">Course {index + 1}</Typography>
                <Divider sx={{ flexGrow: 1, ml: 2 }} />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Course Code"
                    value={course.courseCode}
                    onChange={(e) => handleCourseFieldChange(index, 'courseCode', e.target.value)}
                    error={!!(errors.courses && errors.courses[index]?.courseCode)}
                    helperText={errors.courses && errors.courses[index]?.courseCode}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Course Name"
                    value={course.courseName}
                    onChange={(e) => handleCourseFieldChange(index, 'courseName', e.target.value)}
                    error={!!(errors.courses && errors.courses[index]?.courseName)}
                    helperText={errors.courses && errors.courses[index]?.courseName}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Credits"
                    type="number"
                    value={course.credits}
                    onChange={(e) => handleCourseFieldChange(index, 'credits', e.target.value)}
                    InputProps={{ 
                      inputProps: { min: 1, max: 10 } 
                    }}
                    error={!!(errors.courses && errors.courses[index]?.credits)}
                    helperText={errors.courses && errors.courses[index]?.credits}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Professor"
                    value={course.professor}
                    onChange={(e) => handleCourseFieldChange(index, 'professor', e.target.value)}
                    error={!!(errors.courses && errors.courses[index]?.professor)}
                    helperText={errors.courses && errors.courses[index]?.professor}
                  />
                </Grid>
              </Grid>
            </Box>
          ))}
          
          <Box sx={{ mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<AddIcon />}
            >
              Generate Timetables
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {formData.courses.length > 1 ? 'Courses' : 'Course'} added successfully! Redirecting to dashboard...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TimetableGenerator;
