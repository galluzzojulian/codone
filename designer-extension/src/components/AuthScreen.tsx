import { Container, Typography, Button, Box, Paper } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

/**
 * AuthScreen Component
 *
 * Displays an authentication flow showing a button to authorize the app with Webflow
 *
 * @param onAuth - Callback function that runs after successful authentication.
 */
export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  
  // Initialize the auth hook which provides methods for authentication
  const { user, exchangeAndVerifyIdToken } = useAuth();

  // Function to open the authorization popup window
  const openAuthScreen = async () => {
    setIsAuthorizing(true);
    console.log("Opening auth window...");
    
    try {
      const authWindow = window.open(
        `${base_url}/api/auth/authorize?state=webflow_designer`,
        "_blank",
        "width=600,height=600"
      );

      // Check if the authorization window is closed
      const checkWindow = setInterval(async () => {
        if (authWindow?.closed) {
          console.log("Auth window closed, trying direct token exchange");
          clearInterval(checkWindow);
          
          // Clear any previous auth data
          localStorage.removeItem("wf_hybrid_user");
          localStorage.removeItem("explicitly_logged_out");
          
          // Try to get a token directly
          try {
            await exchangeAndVerifyIdToken();
            onAuth();
          } catch (error) {
            console.error("Failed to exchange token after auth window closed:", error);
          }
          
          setIsAuthorizing(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Error opening auth window:", error);
      setIsAuthorizing(false);
    }
  };

  return (
    <Container 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}
    >
      <Paper 
        elevation={0}
        sx={{ 
          maxWidth: 480, 
          width: '100%',
          p: 4, 
          borderRadius: 3, 
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          bgcolor: 'background.paper'
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 3 }}>
          <img 
            src="/assets/codone-long-white.svg" 
            alt="Codone Logo" 
            style={{ maxWidth: 150, height: 'auto' }} 
          />
        </Box>

        <Typography 
          variant="h1" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '1.75rem', sm: '2rem' } 
          }}
        >
          Welcome to Codone
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 3 }}
        >
          To continue, please authorize your app.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={openAuthScreen}
          disabled={isAuthorizing}
          sx={{ 
            py: 1.2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            borderRadius: 2,
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {isAuthorizing ? "Authorizing..." : "Authorize with Webflow"}
        </Button>
      </Paper>
    </Container>
  );
}
