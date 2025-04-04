import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { getFreeRooms, Classroom } from '../../services/api';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SchoolIcon from '@mui/icons-material/School';

interface RoomGrouped {
  NC: Classroom[];
  NR: Classroom[];
  LAB: Classroom[];
}

const FreeRooms: React.FC = () => {
  const [day, setDay] = useState<string>('Monday');
  const [timeSlot, setTimeSlot] = useState<string>('8 AM');
  const [freeRooms, setFreeRooms] = useState<RoomGrouped | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

  const fetchFreeRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching free rooms for ${day} at ${timeSlot}`);
      
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const result = await getFreeRooms(day, timeSlot, timestamp);
      
      console.log('API response:', result);
      
      // Perform strict validation on the response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid API response format (not an object)');
      }
      
      // Check if we have a rooms property
      if (!result.rooms) {
        throw new Error('API response missing rooms property');
      }
      
      // Initialize empty arrays for any missing room types
      const safeRooms = {
        NC: Array.isArray(result.rooms.NC) ? result.rooms.NC : [],
        NR: Array.isArray(result.rooms.NR) ? result.rooms.NR : [],
        LAB: Array.isArray(result.rooms.LAB) ? result.rooms.LAB : [],
      };
      
      console.log(`Processed ${safeRooms.NC.length + safeRooms.NR.length + safeRooms.LAB.length} free rooms`);
      
      // Set validated rooms data to state
      setFreeRooms(safeRooms);
      
      // Check if we got a message from the server
      if (result.message) {
        console.warn('Server returned message:', result.message);
        // Show as warning instead of error if we have rooms
        const hasRooms = safeRooms.NC.length > 0 || safeRooms.NR.length > 0 || safeRooms.LAB.length > 0;
        if (!hasRooms) {
          setError(result.message);
        }
      }
    } catch (err: any) {
      console.error('Error fetching free rooms:', err.message || err);
      setError(err.message || 'Failed to load rooms. Please try again.');
      
      // Set empty arrays to avoid further errors
      setFreeRooms({
        NC: [],
        NR: [],
        LAB: []
      });
    } finally {
      setLoading(false);
    }
  }, [day, timeSlot]);

  useEffect(() => {
    fetchFreeRooms();
  }, [fetchFreeRooms]); // Updated dependency array

  const handleDayChange = (event: SelectChangeEvent) => {
    setDay(event.target.value);
  };

  const handleTimeChange = (event: SelectChangeEvent) => {
    setTimeSlot(event.target.value);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // Calculate total rooms count
  const getTotalRooms = () => {
    if (!freeRooms) return 0;
    return freeRooms.NC.length + freeRooms.NR.length + freeRooms.LAB.length;
  };

  // Render room cards for the selected type
  const renderRooms = () => {
    if (!freeRooms) return null;

    let roomsToDisplay: Classroom[] = [];
    
    // Filter rooms based on active tab
    if (activeTab === 'all') {
      roomsToDisplay = [...freeRooms.NC, ...freeRooms.NR, ...freeRooms.LAB];
    } else if (activeTab === 'NC') {
      roomsToDisplay = freeRooms.NC;
    } else if (activeTab === 'NR') {
      roomsToDisplay = freeRooms.NR;
    } else if (activeTab === 'LAB') {
      roomsToDisplay = freeRooms.LAB;
    }

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {roomsToDisplay.length > 0 ? (
          roomsToDisplay.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MeetingRoomIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div" gutterBottom>
                      {room.roomNumber}
                    </Typography>
                    <Chip 
                      label={room.type} 
                      size="small" 
                      color={room.type === 'LAB' ? 'secondary' : 'primary'} 
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Capacity:</strong> {room.capacity} students
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Floor:</strong> {room.floor}
                    </Typography>
                    {room.department && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Department:</strong> {room.department.toUpperCase()}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              No {activeTab !== 'all' ? activeTab + ' ' : ''}rooms available for this time slot.
            </Alert>
          </Grid>
        )}
      </Grid>
    );
  };

  if (error) {
    return (
      <div data-testid="free-rooms-error" className="error-message">
        {error}
      </div>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Find Free Rooms
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: '10px' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <InputLabel id="day-select-label">Day</InputLabel>
              <Select
                labelId="day-select-label"
                id="day-select"
                value={day}
                label="Day"
                onChange={handleDayChange}
              >
                {days.map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <InputLabel id="time-select-label">Time Slot</InputLabel>
              <Select
                labelId="time-select-label"
                id="time-select"
                value={timeSlot}
                label="Time Slot"
                onChange={handleTimeChange}
              >
                {timeSlots.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={fetchFreeRooms}
              disabled={loading}
              sx={{ height: '56px' }} // Match height with select inputs
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
            </Button>
          </Grid>
        </Grid>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert 
            severity="warning" 
            sx={{ mt: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={fetchFreeRooms}
              >
                Retry
              </Button>
            }
          >
            {error.includes('init') ? (
              <Box>
                <Typography fontWeight="bold" gutterBottom>Database Setup Required</Typography>
                <Typography>
                  {error} <br />
                  Please contact your administrator to initialize classroom data.
                </Typography>
              </Box>
            ) : error}
          </Alert>
        ) : freeRooms ? (
          <>
            <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
              <SchoolIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                {getTotalRooms()} Free Rooms on {day} at {timeSlot}
              </Typography>
            </Box>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label={`All (${getTotalRooms()})`} value="all" />
                <Tab label={`NC (${freeRooms.NC.length})`} value="NC" />
                <Tab label={`NR (${freeRooms.NR.length})`} value="NR" />
                <Tab label={`LAB (${freeRooms.LAB.length})`} value="LAB" />
              </Tabs>
            </Box>
            
            {renderRooms()}
          </>
        ) : (
          <Alert severity="info" sx={{ mt: 3 }}>
            Select a day and time slot to find available rooms.
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default FreeRooms;
