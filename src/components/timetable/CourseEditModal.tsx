import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Typography,
  Grid,
  TextField,
  SelectChangeEvent,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  Box,
} from '@mui/material';
import { Course, Classroom, createCourse } from '../../services/api';

interface CellInfo {
  timetableId: string;
  slotId?: string;
  courseCode: string;
  professor: string;
  roomNumber: string;
  courseId: string;
}

interface CourseEditModalProps {
  open: boolean;
  onClose: () => void;
  day: string;
  timeSlot: string;
  slotDetails: CellInfo | null;
  courses: Course[];
  classrooms: Classroom[];
  isNewSlot: boolean;
  onSave: (data: {
    courseId: string;
    roomNumber: string;
    day: string;
    startTime: string;
    endTime: string;
  }) => void;
  onDelete?: () => void;
  isSaving: boolean;
  selectedDepartment?: string; // Add this new prop
}

const CourseEditModal: React.FC<CourseEditModalProps> = ({
  open,
  onClose,
  day,
  timeSlot,
  slotDetails,
  courses,
  classrooms,
  isNewSlot,
  onSave,
  onDelete,
  isSaving,
  selectedDepartment = '', // Default to empty string
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>(day);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(timeSlot);
  const [isNewCourseMode, setIsNewCourseMode] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    courseCode: '',
    courseName: '',
    credits: 3,
    professor: '',
    students: 30,
    department: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

  useEffect(() => {
    if (open) {
      setSelectedDay(day);
      setSelectedTimeSlot(timeSlot);

      if (slotDetails) {
        setSelectedCourseId(slotDetails.courseId || '');
        setSelectedRoom(slotDetails.roomNumber || '');
      } else {
        setSelectedCourseId('');
        setSelectedRoom('');
      }
    }
  }, [open, day, timeSlot, slotDetails]);

  useEffect(() => {
    if (isNewCourseMode) {
      setSelectedCourseId('');
    } else {
      setNewCourseData({
        courseCode: '',
        courseName: '',
        credits: 3,
        professor: '',
        students: 30,
        department: '',
      });
      setValidationErrors({});
    }
  }, [isNewCourseMode]);

  useEffect(() => {
    if (isNewCourseMode && selectedDepartment && selectedDepartment !== 'all') {
      setNewCourseData((prev) => ({
        ...prev,
        department: selectedDepartment,
      }));
    }
  }, [isNewCourseMode, selectedDepartment]);

  const validateNewCourse = () => {
    const errors: Record<string, string> = {};

    if (!newCourseData.courseCode) errors.courseCode = 'Course code is required';
    if (!newCourseData.courseName) errors.courseName = 'Course name is required';
    if (!newCourseData.professor) errors.professor = 'Professor name is required';
    if (!newCourseData.department) errors.department = 'Department is required';

    if (newCourseData.credits < 1 || newCourseData.credits > 10)
      errors.credits = 'Credits must be between 1 and 10';

    if (newCourseData.students < 1 || newCourseData.students > 300)
      errors.students = 'Students must be between 1 and 300';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewCourseChange = (field: string, value: string | number) => {
    setNewCourseData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async () => {
    if (isNewCourseMode) {
      if (!validateNewCourse() || !selectedRoom || !selectedDay || !selectedTimeSlot) {
        return;
      }

      try {
        const createdCourse = await createCourse({
          ...newCourseData,
        });

        onSave({
          courseId: createdCourse._id || '',
          roomNumber: selectedRoom,
          day: selectedDay,
          startTime: selectedTimeSlot,
          endTime: getEndTime(selectedTimeSlot),
        });
      } catch (error) {
        console.error('Error creating new course:', error);
      }
    } else {
      if (!selectedCourseId || !selectedRoom || !selectedDay || !selectedTimeSlot) {
        return;
      }

      onSave({
        courseId: selectedCourseId,
        roomNumber: selectedRoom,
        day: selectedDay,
        startTime: selectedTimeSlot,
        endTime: getEndTime(selectedTimeSlot),
      });
    }
  };

  const getEndTime = (startTime: string): string => {
    const timeMap: Record<string, string> = {
      '8 AM': '9 AM',
      '9 AM': '10 AM',
      '10 AM': '11 AM',
      '11 AM': '12 PM',
      '12 PM': '1 PM',
      '2 PM': '3 PM',
      '3 PM': '4 PM',
      '4 PM': '5 PM',
      '5 PM': '6 PM',
    };

    return timeMap[startTime] || '';
  };

  const getFilteredClassrooms = (): Classroom[] => {
    if (isNewCourseMode) {
      if (!newCourseData.credits || !newCourseData.students) return [];

      let filteredRooms = classrooms.filter((c) => c.isAvailable === true);

      if (newCourseData.students > 100) {
        filteredRooms = filteredRooms.filter((c) => c.type !== 'NC');
      }

      if (newCourseData.credits === 2) {
        filteredRooms = filteredRooms.filter((c) => c.type === 'LAB');

        if (newCourseData.department) {
          const deptLabs = filteredRooms.filter(
            (c) => c.department && c.department.toLowerCase() === newCourseData.department.toLowerCase()
          );

          if (deptLabs.length > 0) {
            const otherLabs = filteredRooms.filter(
              (c) => !c.department || c.department.toLowerCase() !== newCourseData.department.toLowerCase()
            );
            filteredRooms = [...deptLabs, ...otherLabs];
          }
        }
      } else {
        filteredRooms = filteredRooms.filter(
          (c) => c.type !== 'LAB' && c.capacity >= newCourseData.students
        );
      }

      return filteredRooms.sort((a, b) => {
        const typeOrder = { NC: 1, NR: 2, LAB: 3 };
        const aOrder = typeOrder[a.type] || 99;
        const bOrder = typeOrder[b.type] || 99;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.capacity - newCourseData.students - (b.capacity - newCourseData.students);
      });
    } else {
      if (!selectedCourseId) return [];

      const selectedCourse = courses.find((c) => c._id === selectedCourseId);
      if (!selectedCourse) return [];

      let filteredRooms = classrooms.filter((c) => c.isAvailable === true);

      if (selectedCourse.students > 100) {
        filteredRooms = filteredRooms.filter((c) => c.type !== 'NC');
      }

      if (selectedCourse.credits === 2) {
        filteredRooms = filteredRooms.filter((c) => c.type === 'LAB');

        if (selectedCourse.department) {
          const deptLabs = filteredRooms.filter(
            (c) => c.department && c.department.toLowerCase() === selectedCourse.department.toLowerCase()
          );

          if (deptLabs.length > 0) {
            const otherLabs = filteredRooms.filter(
              (c) => !c.department || c.department.toLowerCase() !== selectedCourse.department.toLowerCase()
            );
            filteredRooms = [...deptLabs, ...otherLabs];
          }
        }
      } else {
        filteredRooms = filteredRooms.filter(
          (c) => c.type !== 'LAB' && c.capacity >= selectedCourse.students
        );
      }

      return filteredRooms.sort((a, b) => {
        const typeOrder = { NC: 1, NR: 2, LAB: 3 };
        const aOrder = typeOrder[a.type] || 99;
        const bOrder = typeOrder[b.type] || 99;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.capacity - selectedCourse.students - (b.capacity - selectedCourse.students);
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isNewSlot ? 'Add New Course Slot' : 'Edit Course Slot'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              You are editing a slot on <Chip label={selectedDay} size="small" color="primary" /> at{' '}
              <Chip label={selectedTimeSlot} size="small" color="secondary" />
            </Typography>

            {isNewSlot && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isNewCourseMode}
                    onChange={(e) => setIsNewCourseMode(e.target.checked)}
                    color="primary"
                  />
                }
                label="Create a new course"
                sx={{ mt: 2 }}
              />
            )}
          </Grid>

          {isNewCourseMode ? (
            <>
              <Grid item xs={12}>
                <Divider>
                  <Chip label="Create New Course" color="primary" />
                </Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course Code"
                  value={newCourseData.courseCode}
                  onChange={(e) => handleNewCourseChange('courseCode', e.target.value)}
                  error={!!validationErrors.courseCode}
                  helperText={validationErrors.courseCode}
                  disabled={isSaving}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course Name"
                  value={newCourseData.courseName}
                  onChange={(e) => handleNewCourseChange('courseName', e.target.value)}
                  error={!!validationErrors.courseName}
                  helperText={validationErrors.courseName}
                  disabled={isSaving}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={newCourseData.department}
                    onChange={(e) => handleNewCourseChange('department', e.target.value)}
                    label="Department"
                    error={!!validationErrors.department}
                    disabled={isSaving || (selectedDepartment !== 'all' && !!selectedDepartment)}
                  >
                    {(selectedDepartment && selectedDepartment !== 'all') ? (
                      <MenuItem value={selectedDepartment}>
                        {departments.find((d) => d.id === selectedDepartment)?.name || selectedDepartment.toUpperCase()}
                      </MenuItem>
                    ) : (
                      departments
                        .filter((d) => d.id !== 'all')
                        .map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))
                    )}
                  </Select>
                  {validationErrors.department && (
                    <Typography variant="caption" color="error">
                      {validationErrors.department}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Professor"
                  value={newCourseData.professor}
                  onChange={(e) => handleNewCourseChange('professor', e.target.value)}
                  error={!!validationErrors.professor}
                  helperText={validationErrors.professor}
                  disabled={isSaving}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Credits"
                  type="number"
                  value={newCourseData.credits}
                  onChange={(e) => handleNewCourseChange('credits', parseInt(e.target.value) || 0)}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                  error={!!validationErrors.credits}
                  helperText={validationErrors.credits || 'Between 1-10'}
                  disabled={isSaving}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Students"
                  type="number"
                  value={newCourseData.students}
                  onChange={(e) => handleNewCourseChange('students', parseInt(e.target.value) || 0)}
                  InputProps={{ inputProps: { min: 1, max: 300 } }}
                  error={!!validationErrors.students}
                  helperText={validationErrors.students || 'Between 1-300'}
                  disabled={isSaving}
                  required
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Course</InputLabel>
                <Select
                  value={selectedCourseId}
                  onChange={(e: SelectChangeEvent) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedRoom('');
                  }}
                  label="Course"
                  disabled={isSaving}
                >
                  {courses
                    .filter((course) => selectedDepartment === 'all' || course.department === selectedDepartment)
                    .map((course) => (
                      <MenuItem key={course._id} value={course._id || ''}>
                        <div>
                          <Typography variant="body1">
                            {course.courseCode}: {course.courseName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Prof. {course.professor} • {course.credits} credits
                          </Typography>
                        </div>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} md={isNewCourseMode ? 12 : 6}>
            <FormControl fullWidth required>
              <InputLabel>Room</InputLabel>
              <Select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                label="Room"
                disabled={isSaving || (!selectedCourseId && !isNewCourseMode)}
              >
                {getFilteredClassrooms().map((classroom) => (
                  <MenuItem key={classroom._id} value={classroom.roomNumber}>
                    <div>
                      <Typography variant="body1">{classroom.roomNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {classroom.type} • Capacity: {classroom.capacity}
                        {isNewCourseMode
                          ? classroom.capacity < newCourseData.students && ' (Insufficient)'
                          : courses.find((course) => course._id === selectedCourseId) &&
                            classroom.capacity <
                              courses.find((course) => course._id === selectedCourseId)!.students &&
                            ' (Insufficient)'}
                        {classroom.department ? ` • Dept: ${classroom.department.toUpperCase()}` : ''}
                      </Typography>
                    </div>
                  </MenuItem>
                ))}
                {getFilteredClassrooms().length === 0 && (
                  <MenuItem disabled value="">
                    <Typography variant="body2" color="error">
                      No suitable rooms available
                    </Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Chip label="Time and Day" size="small" />
            </Divider>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Day</InputLabel>
              <Select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                label="Day"
                disabled={isSaving}
              >
                {days.map((dayOption) => (
                  <MenuItem key={dayOption} value={dayOption}>
                    {dayOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Time Slot</InputLabel>
              <Select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                label="Time Slot"
                disabled={isSaving}
              >
                {timeSlots.map((time) => (
                  <MenuItem key={time} value={time}>
                    {time} - {getEndTime(time)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {!isNewSlot && onDelete && (
          <Button onClick={onDelete} color="error" disabled={isSaving}>
            Delete Slot
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={
            isSaving ||
            (!isNewCourseMode && !selectedCourseId) ||
            !selectedRoom ||
            !selectedDay ||
            !selectedTimeSlot
          }
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const departments = [
  { id: 'all', name: 'All Departments' },
  { id: 'cs', name: 'Computer Science' },
  { id: 'mnc', name: 'Mathematics & Computing' },
  { id: 'ee', name: 'Electrical Engineering' },
  { id: 'me', name: 'Mechanical Engineering' },
  { id: 'ce', name: 'Civil Engineering' },
];

export default CourseEditModal;