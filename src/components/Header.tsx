import React from 'react';
import { AppBar, Toolbar, Button, Box, Container, Avatar, Typography, IconButton } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* App logo/name - visible on all screen sizes */}
          <Box 
            component={RouterLink} 
            to="/dashboard"
            sx={{ 
              display: 'flex',
              alignItems: 'center', 
              mr: 2,
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': { opacity: 0.9 },
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
              }}
            >
              Schedulr
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {!isLoggedIn ? (
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
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user?.name || user?.email}
              </Typography>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;