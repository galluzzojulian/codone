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
  
  // Initialize the auth hook which provides methods for authentication
  const { user } = useAuth();

  // Function to open the authorization popup window
  const openAuthScreen = () => {
    console.log("Opening auth window..."); // Debug
    const authWindow = window.open(
      `${base_url}/api/auth/authorize?state=webflow_designer`,
      "_blank",
      "width=600,height=600"
    );

    // Check if the authorization window is closed
    const checkWindow = setInterval(() => {
      if (authWindow?.closed) {
        console.log("Auth window closed"); // Debug
        clearInterval(checkWindow);
        // The token exchange will be handled by the message event listener in App.tsx
        onAuth();
      }
    }, 1000);
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
      >
        Authorize App
      </Button>
    </Container>
  );
}
