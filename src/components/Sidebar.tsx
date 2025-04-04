import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState<boolean>(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Only show sidebar when user is logged in
  if (!isLoggedIn) return null;
  
  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Navigation items - "View Timetable" option removed
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Find Free Rooms', icon: <MeetingRoomIcon />, path: '/free-rooms' },
    { text: 'Edit Timetable', icon: <EditIcon />, path: '/edit-timetable?dept=cs' },
    { text: 'Create Timetable', icon: <AddIcon />, path: '/create' },
  ];
  
  const sideList = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={isSmallScreen ? toggleDrawer : undefined}
    >
      <Divider />
      
      <List>
        {navItems.map((item) => (
          <ListItemButton 
            component={RouterLink} 
            to={item.path} 
            key={item.text}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
  
  return (
    <>
      {isSmallScreen ? (
        <IconButton 
          edge="start" 
          color="inherit" 
          aria-label="menu" 
          onClick={toggleDrawer}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
      ) : (
        <Drawer
          variant="permanent"
          open={true}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 250,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%'
            }
          }}
        >
          {sideList()}
        </Drawer>
      )}
      
      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        {sideList()}
      </Drawer>
    </>
  );
};

export default Sidebar;
