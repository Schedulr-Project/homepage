import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';

const Header: React.FC = () => {
  return (
    <AppBar position="static" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box 
            component={RouterLink} 
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 2,
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            <CalendarMonthIcon sx={{ mr: 1, color: '#ffd600' }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 800,
                letterSpacing: '1px',
                background: 'linear-gradient(45deg, #ffd600, #ff4081, #7c4dff)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient 3s ease infinite',
                '@keyframes gradient': {
                  '0%': {
                    backgroundPosition: '0% 50%',
                  },
                  '50%': {
                    backgroundPosition: '100% 50%',
                  },
                  '100%': {
                    backgroundPosition: '0% 50%',
                  },
                },
              }}
            >
              Schedulr
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/login"
              sx={{
                borderRadius: 2,
                px: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Login
            </Button>
            <Button 
              color="inherit"
              component={RouterLink}
              to="/create"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Create Timetable
            </Button>
            <Button
              variant="contained"
              color="secondary"
              component={RouterLink}
              to="/generator"
              sx={{
                borderRadius: 2,
                px: 3,
                background: 'linear-gradient(45deg, #ff4081 30%, #c60055 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ff79b0 30%, #ff4081 90%)',
                },
              }}
            >
              Timetable Generator
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;