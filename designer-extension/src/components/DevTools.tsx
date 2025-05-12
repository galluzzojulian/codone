import { Box, Button, Typography, Paper, Divider } from "@mui/material";
import { useDevTools } from "../hooks/useDevTools";

interface DevToolsProps {
  logout: () => void;
  setHasClickedFetch: (value: boolean) => void;
}

export function DevTools({ logout, setHasClickedFetch }: DevToolsProps) {
  const { clearSession, logStorage } = useDevTools({
    logout,
    setHasClickedFetch,
  });

  const handleClearClick = () => {
    clearSession();
    window.location.reload(); // Force a complete refresh after clearing
  };

  const handleLogout = () => {
    logout();
    window.location.reload(); // Refresh to show login screen
  };

  return (
    <Paper
      elevation={0}
      sx={{
        padding: 3,
        mt: 4,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h3" gutterBottom color="text.primary" sx={{ fontSize: '1.1rem' }}>
        Development Tools
      </Typography>
      
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleLogout}
          size="small"
        >
          Logout
        </Button>

        <Button 
          variant="outlined" 
          color="error" 
          onClick={handleClearClick}
          size="small"
        >
          Clear Session
        </Button>

        <Button 
          variant="outlined" 
          onClick={logStorage}
          size="small"
          sx={{ borderColor: 'divider', color: 'text.secondary' }}
        >
          Log Storage
        </Button>
      </Box>
    </Paper>
  );
}
