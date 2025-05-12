import { useEffect, useState, useRef } from "react";
import { ThemeProvider, Box } from "@mui/material";

// Components
import { Dashboard } from "./components/Dashboard";
import { AuthScreen } from "./components/AuthScreen";
import { DevTools } from "./components/DevTools";

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
      const storedUser = localStorage.getItem("wf_hybrid_user");
      const wasExplicitlyLoggedOut = localStorage.getItem(
        "explicitly_logged_out"
      );

      if (storedUser && !wasExplicitlyLoggedOut) {
        exchangeAndVerifyIdToken();
      }
      hasCheckedToken.current = true;
    }

    // Handle the authentication complete event from popup
    const handleAuthComplete = async (event: MessageEvent) => {
      if (event.data === "authComplete") {
        localStorage.removeItem("explicitly_logged_out");
        await exchangeAndVerifyIdToken();
      }
    };

    // Add the event listener for the authentication complete event
    window.addEventListener("message", handleAuthComplete);
    return () => {
      window.removeEventListener("message", handleAuthComplete);
      hasCheckedToken.current = false;
    };
  }, [exchangeAndVerifyIdToken]);

  // Handle the fetch sites button click
  const handleFetchSites = () => {
    setHasClickedFetch(true);
    fetchSites();
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
        />
      ) : (
        <AuthScreen onAuth={() => {}} />
      )}
      <DevTools logout={logout} setHasClickedFetch={setHasClickedFetch} />
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
