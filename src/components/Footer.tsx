import React from 'react';
import { Box, Typography, Container, Link } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        background: 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)',
        color: '#fff',
        borderTop: '1px solid rgba(124, 77, 255, 0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Schedulr - Timetable Management System
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="#"
              color="inherit"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                '&:hover': {
                  color: '#ffd600',
                },
              }}
            >
              <GitHubIcon fontSize="small" />
              GitHub
            </Link>
            <Link
              href="#"
              color="inherit"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                '&:hover': {
                  color: '#ffd600',
                },
              }}
            >
              <LinkedInIcon fontSize="small" />
              LinkedIn
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 