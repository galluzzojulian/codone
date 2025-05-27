import { useEffect, useState, useRef } from "react";
import { ThemeProvider, Box } from "@mui/material";

// Components
import { Dashboard } from "./components/Dashboard";
import { AuthScreen } from "./components/AuthScreen";
import { WebflowAuthorizeScreen } from "./components/WebflowAuthorizeScreen";

// Hooks and utilities
import { useAuth } from "./hooks/useAuth";
import { useSites } from "./hooks/useSites";
import { theme } from "./components/theme";

// Styles
import "./App.css";

// Memberstack
import memberstackDOM from "@memberstack/dom";
import { MemberstackProvider } from "./contexts/MemberstackContext";

// Define a basic type for the Memberstack instance. 
// Ideally, import this from @memberstack/dom if they provide a type for the initialized instance.
// For now, let's assume it has at least `loginMemberEmailPassword` and other methods we might need.
interface InitializedMemberstack {
  loginMemberEmailPassword: (credentials: { email: string; password?: string; metadata?: any; }) => Promise<any>; // Be more specific with 'any' if possible
  // Add other methods like getMember, logout, etc., as you define them in MemberstackInstance
  [key: string]: any; // Allow other properties/methods if not fully typed
}

// Type for auth phases
type AuthPhase = "MEMBERSTACK_LOGIN" | "WEBFLOW_AUTHORIZE" | "AUTHENTICATED";

/**
 * App.tsx serves as the main entry point for the Webflow App.
 * It handles authentication flow, routing, and data fetching.
 */
function AppContent() {
  const [authPhase, setAuthPhase] = useState<AuthPhase>("MEMBERSTACK_LOGIN");
  const [hasClickedFetch, setHasClickedFetch] = useState(false);
  const { user, sessionToken, exchangeAndVerifyIdToken, logout, isAuthLoading } = useAuth();
  const { sites, isLoading: sitesLoading, isError: sitesIsError, error: sitesError, fetchSites } = useSites(
    sessionToken,
    hasClickedFetch
  );

  const hasAttemptedTokenExchange = useRef(false);

  useEffect(() => {
    // @ts-ignore
    webflow.setExtensionSize("large");

    // If we have a sessionToken, we are authenticated (or trying to be based on useAuth logic)
    if (sessionToken) {
      setAuthPhase("AUTHENTICATED");
      hasAttemptedTokenExchange.current = true;
    } else if (authPhase === "WEBFLOW_AUTHORIZE" && !hasAttemptedTokenExchange.current && !isAuthLoading) {
      console.log("Attempting Webflow token exchange after popup closure or phase switch...");
      exchangeAndVerifyIdToken().then(token => {
        if (token) {
          setAuthPhase("AUTHENTICATED");
        } else {
          console.log("Webflow token exchange failed. Staying in Webflow auth phase.");
        }
        hasAttemptedTokenExchange.current = true;
      }).catch(err => {
        console.error("Error during explicit token exchange:", err);
      });
    }

  }, [sessionToken, authPhase, exchangeAndVerifyIdToken, isAuthLoading]);

  // Handle the fetch sites button click
  const handleFetchSites = () => {
    setHasClickedFetch(true);
    fetchSites();
  };

  const handleMemberstackLoginSuccess = () => {
    console.log("Memberstack login successful, proceeding to Webflow authorization.");
    setAuthPhase("WEBFLOW_AUTHORIZE");
    hasAttemptedTokenExchange.current = false;
  };

  const handleWebflowAuthorizationCompleted = () => {
    console.log("Webflow authorization popup closed. Attempting token exchange.");
    hasAttemptedTokenExchange.current = false;
    exchangeAndVerifyIdToken().then(token => {
      if (token) {
        setAuthPhase("AUTHENTICATED");
      }
    });
  };

  if (isAuthLoading && authPhase !== "MEMBERSTACK_LOGIN" && !sessionToken) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading authentication...</Box>;
  }

  return (
    <Box>
      {authPhase === "AUTHENTICATED" && sessionToken ? (
        <Dashboard
          user={user}
          sites={sites}
          isLoading={sitesLoading}
          isError={sitesIsError}
          error={sitesError?.message || ""}
          onFetchSites={handleFetchSites}
          logout={() => {
            logout();
            setAuthPhase("MEMBERSTACK_LOGIN");
            hasAttemptedTokenExchange.current = false;
          }}
          setHasClickedFetch={setHasClickedFetch}
        />
      ) : authPhase === "WEBFLOW_AUTHORIZE" ? (
        <WebflowAuthorizeScreen onAuthorized={handleWebflowAuthorizationCompleted} />
      ) : (
        <AuthScreen onAuth={handleMemberstackLoginSuccess} />
      )}
    </Box>
  );
}

function App() {
  const [memberstackInstance, setMemberstackInstance] = useState<InitializedMemberstack | null>(null);

  useEffect(() => {
    console.log("Initializing Memberstack...");
    const instance = memberstackDOM.init({
      publicKey: "pk_sb_d8de8970348d1d4e65ca", // Make sure this is your correct Memberstack public key
      useCookies: true
      // Add other config from Memberstack docs if needed e.g. cookieSameSite: 'Lax'
    });
    // @ts-ignore Type 'unknown' is not assignable to type 'InitializedMemberstack'.
    setMemberstackInstance(instance);
    console.log("Memberstack initialized:", instance);

    // Optional: return a cleanup function if memberstackDOM.init returns a way to destroy/cleanup
    // This depends on Memberstack's API for cleanup if the component unmounts.
    // return () => {
    //   if (instance && typeof instance.destroy === 'function') {
    //     instance.destroy(); 
    //   }
    // };
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  if (!memberstackInstance) {
    // You might want to render a loading indicator here while Memberstack initializes
    return <Box>Loading Memberstack...</Box>; 
  }

  return (
    <ThemeProvider theme={theme}>
      <MemberstackProvider instance={memberstackInstance}>
        <AppContent />
      </MemberstackProvider>
    </ThemeProvider>
  );
}

export default App;
