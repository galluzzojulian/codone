import { Container, Typography, Button } from "@mui/material";
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
    <Container sx={{ padding: "20px" }}>
      <Typography variant="h1">
        {user.firstName
          ? `Welcome back ${user.firstName} 👋🏾`
          : "Hello Stranger 👋🏾"}
      </Typography>
      
      <Button
        variant="contained"
        sx={{ margin: "10px 20px" }}
        onClick={openAuthScreen}
        disabled={isAuthorizing}
      >
        {isAuthorizing ? "Authorizing..." : "Authorize App"}
      </Button>
    </Container>
  );
}
