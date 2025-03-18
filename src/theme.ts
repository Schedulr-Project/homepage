import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c4dff', // Deep Purple
      light: '#b47cff',
      dark: '#3f1dcb',
    },
    secondary: {
      main: '#ff4081', // Pink
      light: '#ff79b0',
      dark: '#c60055',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    success: {
      main: '#00c853', // Green
      light: '#5efc82',
      dark: '#009624',
    },
    warning: {
      main: '#ffd600', // Amber
      light: '#ffff52',
      dark: '#c7a600',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.3px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          background: 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)',
          borderBottom: '1px solid rgba(124, 77, 255, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: '#2d2d2d',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;

 