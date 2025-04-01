import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Table from './components/timetable/Table';
import TimetableGenerator from './components/timetable/TimetableGenerator';
import EditTimetable from './components/timetable/EditTimetable';
import Footer from './components/Footer';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
          }}
        >
          <Header />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/generator" element={<Table />} />
              <Route path="/edit-timetable" element={<EditTimetable />} />
              <Route path="/create" element={<TimetableGenerator />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
