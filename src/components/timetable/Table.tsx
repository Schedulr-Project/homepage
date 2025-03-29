import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Table.css';
import Cell from './Cell';
import { Box, Typography, Container, Paper } from '@mui/material';

interface CourseData {
  id: number;
  department: string;
  courseCode: string;
  courseName: string;
  credits: number;
  professor: string;
}

const Table: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const deptParam = searchParams.get('dept');
  const codeParam = searchParams.get('code');
  
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const def = ['Days','8 AM - 9 AM','9 AM - 10 AM','10 AM - 11 AM','11 AM - 12 PM','12 PM - 1 PM','2 PM - 3 PM','3 PM - 4 PM','4 PM - 5 PM','5 PM - 6 PM'];
  const mon = ['Monday','','','','','','','','',''];
  const tue = ['Tuesday','','','','','','','','',''];
  const wed = ['Wednesday','','','','','','','','',''];
  const thurs = ['Thursday','','','','','','','','',''];
  const fri = ['Friday','','','','','','','','',''];
  const sat = ['Saturday','','','','','','','','',''];

  useEffect(() => {
    setIsLoading(true);
    
    // If we have query parameters, load the specific course
    if (deptParam && codeParam) {
      const savedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      const course = savedCourses.find((c: CourseData) => 
        c.department === deptParam && c.courseCode === codeParam
      );
      
      if (course) {
        setCourseData(course);
        
        // Place the course in the timetable (simple algorithm)
        // In a real app, you'd have more complex logic
        if (course.credits > 0) {
          // Based on credits, place in different days
          mon[2] = course.courseCode; // Monday 9-10
          wed[3] = course.courseCode; // Wednesday 10-11
          if (course.credits >= 3) {
            fri[4] = course.courseCode; // Friday 11-12
          }
        }
      }
    }
    
    setIsLoading(false);
  }, [deptParam, codeParam]);

  return (
    <div className="table-container">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
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
            </Box>
          </Paper>
        )}

        <div className="container">
          <h2 className='heading'>TimeTable</h2>
          <Cell className="toprow" items={def}></Cell>
          <Cell items={mon} />   
          <Cell items={tue} />   
          <Cell items={wed} />   
          <Cell items={thurs} />   
          <Cell items={fri} />   
          <Cell items={sat} />           
        </div>
      </Container>
    </div>
  );
};

export default Table;
