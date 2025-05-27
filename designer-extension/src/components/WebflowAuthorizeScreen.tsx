import { Container, Typography, Button, Box, Paper } from "@mui/material";
import { useState } from "react";

/**
 * WebflowAuthorizeScreen Component
 *
 * Displays a button to authorize the app with Webflow.
 * Calls onAuthorized callback when the Webflow auth popup is closed,
 * signaling that token exchange can be attempted.
 *
 * @param onAuthorized - Callback function to run when the auth window is closed.
 */
export function WebflowAuthorizeScreen({ onAuthorized }: { onAuthorized: () => void }) {
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const openWebflowAuthPopup = async () => {
    setIsAuthorizing(true);
    console.log("Opening Webflow auth window...");

    try {
      const authWindow = window.open(
        `${base_url}/api/auth/authorize?state=webflow_designer`,
        "_blank",
        "width=600,height=600"
      );

      const checkWindow = setInterval(() => {
        if (authWindow?.closed) {
          console.log("Webflow auth window closed by user.");
          clearInterval(checkWindow);
          setIsAuthorizing(false);
          onAuthorized(); // Signal that the Webflow auth attempt (popup closure) is done
        }
      }, 1000);
    } catch (error) {
      console.error("Error opening Webflow auth window:", error);
      setIsAuthorizing(false);
      // Optionally, call onAuthorized with an error or handle error state here
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
          Authorize Access
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          To continue, please authorize Codone to access your Webflow sites.
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={openWebflowAuthPopup}
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
          {isAuthorizing ? "Waiting for Authorization..." : "Authorize with Webflow"}
        </Button>
      </Paper>
    </Container>
  );
} 