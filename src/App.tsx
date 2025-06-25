import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Table from './components/timetable/Table';
import TimetableGenerator from './components/timetable/TimetableGenerator';
import EditTimetable from './components/timetable/EditTimetable';
import FreeRooms from './components/rooms/FreeRooms';
import Footer from './components/Footer';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
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
            
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
              <Sidebar />
              
              <Box 
                component="main" 
                sx={{ 
                  flexGrow: 1, 
                  padding: { xs: 2, md: 3 },
                  overflowX: 'auto' 
                }}
              >
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/generator" element={
                    <ProtectedRoute>
                      <Table />
                    </ProtectedRoute>
                  } />
                  <Route path="/edit-timetable" element={
                    <ProtectedRoute>
                      <EditTimetable />
                    </ProtectedRoute>
                  } />
                  <Route path="/create" element={
                    <ProtectedRoute>
                      <TimetableGenerator />
                    </ProtectedRoute>
                  } />
                  <Route path="/free-rooms" element={
                    <ProtectedRoute>
                      <FreeRooms />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Box>
            </Box>
            
            <Footer />
          </Box>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
