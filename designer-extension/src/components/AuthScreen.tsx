import { Container, Typography, Button, Box, Paper, TextField, Alert } from "@mui/material";
// import { useAuth } from "../hooks/useAuth"; // Not directly used here anymore, AppContent handles post-auth
import { useState } from "react";
// import memberstackDOM from "@memberstack/dom"; // No longer needed, get instance from context
import { useMemberstack } from "../contexts/MemberstackContext"; // Import the custom hook

/**
 * AuthScreen Component
 *
 * Displays a Memberstack email/password login form.
 * On successful login, calls the onAuth callback.
 *
 * @param onAuth - Callback function that runs after successful authentication.
 */
export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const memberstack = useMemberstack(); // Get Memberstack instance from context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // The base_url and useAuth hook might still be needed if Webflow auth follows Memberstack auth
  // const base_url = import.meta.env.VITE_NEXTJS_API_URL;
  // const { user, exchangeAndVerifyIdToken } = useAuth();


  const handleMemberstackLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    try {
      const { data, error: loginErrorObj } = await memberstack.loginMemberEmailPassword({
        email,
        password,
      });

      if (loginErrorObj) {
        // Use loginErrorObj for more detailed error information if available
        throw new Error(loginErrorObj.message || "An unknown error occurred during login.");
      }
      
      if (data?.member) {
        console.log("Memberstack login successful:", data.member);
        onAuth(); 
      } else {
        throw new Error("Login did not return a member object and no specific error was provided.");
      }

    } catch (err: any) {
      console.error("Memberstack login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Original Webflow authorization logic - can be re-introduced if needed after MS login
  /*
  const openAuthScreen = async () => {
    setIsAuthorizing(true);
    console.log("Opening auth window...");
    // ... (rest of original openAuthScreen logic)
  };
  */

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
        component="form" // Make Paper a form element
        onSubmit={handleMemberstackLogin}
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
            mb: 1, // Adjusted margin
            fontSize: { xs: '1.75rem', sm: '2rem' } 
          }}
        >
          Log In
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 3 }}
        >
          Access your Codone account.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
          disabled={isLoggingIn}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
          disabled={isLoggingIn}
        />
        
        <Button
          type="submit" // Important for form submission
          variant="contained"
          size="large"
          fullWidth
          disabled={isLoggingIn}
          sx={{ 
            py: 1.2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            borderRadius: 2,
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {isLoggingIn ? "Logging In..." : "Log In"}
        </Button>
      </Paper>
    </Container>
  );
}
