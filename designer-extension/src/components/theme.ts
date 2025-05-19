import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#006acc', // Updated primary blue
      light: '#0088ff',
      dark: '#004f99',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e6e9ef', // Light gray for dark mode
      light: '#ffffff',
      dark: '#b8bdc7',
      contrastText: '#18181d',
    },
    background: {
      default: '#292929', // Requested background color
      paper: '#333333',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b5be',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      letterSpacing: '-0.015em',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset',
          fontWeight: 500,
          padding: '6px 14px', // Reduced padding for smaller buttons
          fontSize: '0.85rem', // Smaller font size
          '&:hover': {
            boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset',
          },
        },
        containedPrimary: {
          boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset',
          '&:hover': {
            backgroundColor: '#0088ff', // Adjusted lighter blue
            boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(255, 255, 255, 0.15)',
          boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset',
          '&:hover': {
            backgroundColor: 'rgba(0, 106, 204, 0.15)', // Adjusted background hover color
            borderColor: '#006acc', // Updated border color
            boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
          borderRadius: 8,
          backgroundColor: '#333333',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#333333',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(67, 83, 255, 0.2)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#b0b5be',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
      },
    },
  },
});

export { theme };
