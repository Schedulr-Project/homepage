import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';

const Dashboard: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState('All');

  const branches = ['All', 'CS', 'MNC', 'EE'];

  // Mock data for timetables
  const timetables = [
    { id: 1, branch: 'CS', name: 'CS Semester 4 Timetable', semester: '4th' },
    { id: 2, branch: 'MNC', name: 'MNC Semester 4 Timetable', semester: '4th' },
    { id: 3, branch: 'EE', name: 'EE Semester 4 Timetable', semester: '4th' },
  ];

  const handleBranchChange = (event: any) => {
    setSelectedBranch(event.target.value);
  };

  const handleDownload = (timetableId: number) => {
    // TODO: Implement PDF download functionality
    console.log(`Downloading timetable ${timetableId}`);
  };

  // Filter timetables based on selected branch
  const filteredTimetables = selectedBranch === 'All' 
    ? timetables 
    : timetables.filter(timetable => timetable.branch === selectedBranch);

  return (
    <Container maxWidth="lg">
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'rgba(30, 30, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(124, 77, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <SchoolIcon sx={{ mr: 2, fontSize: 40, color: '#b47cff' }} />
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: '2px',
              color: '#b47cff',
              textShadow: '2px 2px 4px rgba(124, 77, 255, 0.3)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-4px',
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #7c4dff, #ff4081)',
                borderRadius: '2px',
              },
            }}
          >
            Dashboard
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Branch</InputLabel>
            <Select
              value={selectedBranch}
              label="Select Branch"
              onChange={handleBranchChange}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#7c4dff',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#b47cff',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#7c4dff',
                },
                color: '#fff',
              }}
            >
              {branches.map((branch) => (
                <MenuItem key={branch} value={branch}>
                  {branch}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3}>
          {filteredTimetables.map((timetable) => (
            <Grid item xs={12} sm={6} md={4} key={timetable.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#2d2d2d',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(45deg, #7c4dff 30%, #ff4081 90%)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    {timetable.name}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={timetable.semester}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={timetable.branch}
                      color="secondary"
                      size="small"
                    />
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(timetable.id)}
                    fullWidth
                    sx={{
                      mt: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'transparent',
                      color: '#7c4dff',
                      border: '2px solid #7c4dff',
                      '&:hover': {
                        background: 'transparent',
                        borderColor: '#ff4081',
                        color: '#ff4081',
                        '&::before': {
                          transform: 'translateX(100%)',
                        },
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(45deg, #7c4dff, #ff4081)',
                        opacity: 0,
                        transition: 'transform 0.3s ease',
                        transform: 'translateX(-100%)',
                        zIndex: -1,
                      },
                    }}
                  >
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard; 