import { useEffect, useState, useRef } from "react";
import { ThemeProvider, Box } from "@mui/material";

// Components
import { Dashboard } from "./components/Dashboard";
import { AuthScreen } from "./components/AuthScreen";

// Hooks and utilities
import { useAuth } from "./hooks/useAuth";
import { useSites } from "./hooks/useSites";
import { theme } from "./components/theme";

// Styles
import "./App.css";

/**
 * App.tsx serves as the main entry point for the Webflow App.
 * It handles authentication flow, routing, and data fetching.
 */
function AppContent() {
  const [hasClickedFetch, setHasClickedFetch] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { user, sessionToken, exchangeAndVerifyIdToken, logout } = useAuth();
  const { sites, isLoading, isError, error, fetchSites } = useSites(
    sessionToken,
    hasClickedFetch
  );

  // Store if auth token was already checked to avoid redundant checks
  const hasCheckedToken = useRef(false);

  useEffect(() => {
    // Set the extension size to large
    webflow.setExtensionSize("large");

    // Only run auth flow if not already checked
    if (!hasCheckedToken.current) {
      console.log("Initial auth check");
      const storedUser = localStorage.getItem("wf_hybrid_user");
      const wasExplicitlyLoggedOut = localStorage.getItem(
        "explicitly_logged_out"
      );

      if (storedUser && !wasExplicitlyLoggedOut) {
        exchangeAndVerifyIdToken();
      }
      hasCheckedToken.current = true;
    }

    // Debug only - log current auth state
    console.log("Current auth state:", { 
      user, 
      hasToken: !!sessionToken,
      storedUser: localStorage.getItem("wf_hybrid_user") ? "exists" : "none" 
    });
  }, [exchangeAndVerifyIdToken, forceUpdate, user, sessionToken]);

  // Handle the fetch sites button click
  const handleFetchSites = () => {
    setHasClickedFetch(true);
    fetchSites();
  };

  // Handle auth completion from the AuthScreen component
  const handleAuthCompletion = async () => {
    console.log("Auth completed, refreshing app state");
    try {
      // Force a refresh of the app state
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error("Error in auth completion:", error);
    }
  };

  return (
    <Box>
      {sessionToken ? (
        <Dashboard
          user={user}
          sites={sites}
          isLoading={isLoading}
          isError={isError}
          error={error?.message || ""}
          onFetchSites={handleFetchSites}
          logout={logout}
          setHasClickedFetch={setHasClickedFetch}
        />
      ) : (
        <AuthScreen onAuth={handleAuthCompletion} />
      )}
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
