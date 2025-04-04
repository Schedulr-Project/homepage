import React, { useState, useEffect, useCallback } from 'react';
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
  Divider,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { createCourse, Course, generateTimetables } from '../../services/api';

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
  students: number; // Added students field
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
    students?: string; // Added students field for validation
  }}
}

const initialCourseInfo: CourseInfo = {
  courseCode: '',
  courseName: '',
  credits: 3,
  professor: '',
  students: 30 // Default number of students
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
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Memoize the course array update logic to prevent unnecessary re-renders
  const updateCoursesArray = useCallback(() => {
    setFormData(prev => {
      const newCourses = [...prev.courses];
      const currentLength = newCourses.length;
      const targetLength = prev.courseCount;

      if (currentLength < targetLength) {
        for (let i = currentLength; i < targetLength; i++) {
          newCourses.push({ ...initialCourseInfo });
        }
      } else if (currentLength > targetLength) {
        newCourses.splice(targetLength);
      }

      return { ...prev, courses: newCourses };
    });
  }, []);

  // Update courses array only when courseCount changes
  useEffect(() => {
    updateCoursesArray();
  }, [formData.courseCount, updateCoursesArray]);

  const handleDepartmentChange = (e: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      department: e.target.value
    }));
    if (errors.department) {
      setErrors(prevErrors => ({
        ...prevErrors,
        department: undefined
      }));
    }
  };

  const handleCourseCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const courseCount = Math.min(Math.max(value, 1), 10); // Limit between 1-10 courses
    setFormData(prev => ({
      ...prev,
      courseCount
    }));
    if (errors.courseCount) {
      setErrors(prevErrors => ({
        ...prevErrors,
        courseCount: undefined
      }));
    }
  };

  const handleCourseFieldChange = (
    index: number,
    field: keyof CourseInfo,
    value: string | number
  ) => {
    setFormData(prev => {
      const newCourses = [...prev.courses];
      newCourses[index] = {
        ...newCourses[index],
        [field]: field === 'credits' || field === 'students' ? parseInt(value as string) || 0 : value
      };
      return { ...prev, courses: newCourses };
    });

    if (errors.courses && errors.courses[index] && errors.courses[index][field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (newErrors.courses && newErrors.courses[index]) {
          newErrors.courses[index] = {
            ...newErrors.courses[index],
            [field]: undefined
          };
        }
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
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

    const coursesErrors: { [index: number]: any } = {};
    formData.courses.forEach((course, index) => {
      const courseErrors: Partial<CourseInfo> = {};
      if (!course.courseCode) courseErrors.courseCode = "Course code is required";
      if (!course.courseName) courseErrors.courseName = "Course name is required";
      if (course.credits <= 0) courseErrors.credits = 1;
      if (!course.professor) courseErrors.professor = "Professor name is required";
      if (course.students <= 0) courseErrors.students = 1;

      if (Object.keys(courseErrors).length > 0) {
        coursesErrors[index] = courseErrors;
        hasError = true;
      }
    });

    if (Object.keys(coursesErrors).length > 0) {
      newErrors.courses = coursesErrors;
    }

    setErrors(newErrors);
    return !hasError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const creationPromises = formData.courses.map(course =>
        createCourse({
          ...course,
          department: formData.department
        })
      );
      await Promise.all(creationPromises);

      try {
        await generateTimetables({
          department: formData.department,
          semester: 'Fall',
          year: new Date().getFullYear()
        });
        setSnackbarMessage('Courses added and timetables generated! Redirecting...');
      } catch {
        setSnackbarMessage('Courses added successfully! Redirecting...');
      }

      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate(`/generator?dept=${formData.department}`), 1500);
    } catch {
      setSnackbarMessage('Failed to create courses. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

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
                
                <Grid item xs={12} sm={4}>
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
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Number of Students"
                    type="number"
                    value={course.students}
                    onChange={(e) => handleCourseFieldChange(index, 'students', e.target.value)}
                    InputProps={{ 
                      inputProps: { min: 1, max: 300 } 
                    }}
                    error={!!(errors.courses && errors.courses[index]?.students)}
                    helperText={errors.courses && errors.courses[index]?.students}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
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
              startIcon={!isSubmitting ? <AddIcon /> : null}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Generate Timetables'
              )}
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
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TimetableGenerator;
