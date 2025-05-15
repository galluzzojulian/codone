import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { User, DecodedToken } from "../types/types";

const base_url = import.meta.env.VITE_NEXTJS_API_URL;

interface AuthState {
  user: User;
  sessionToken: string;
}

/**
 * Custom hook for managing authentication state and token exchange.
 *
 * Authentication Flow:
 * 1. User initiates auth -> exchangeAndVerifyIdToken()
 *    - Gets ID token from Webflow (Designer APIs)
 *    - Exchanges it for a session token via API
 *
 * 2. Token Exchange -> tokenMutation
 *    - Sends ID token to Data Client
 *    - Data Client validates and returns session token
 *    - On success, decodes and stores token + user data
 *
 * 3. Session Management -> useQuery for token validation
 *    - Automatically checks for existing valid session
 *    - Handles token expiration
 *    - Manages loading states
 *
 * @returns {Object} Authentication utilities and state
 * - user: Current user information
 * - sessionToken: Active session token
 * - isAuthLoading: Loading state
 * - exchangeAndVerifyIdToken: Exchange ID token for session token
 * - logout: Clear authentication state
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const isExchangingToken = { current: false };

  // Query for managing auth state and token validation
  const { data: authState, isLoading: isAuthLoading } = useQuery<AuthState>({
    queryKey: ["auth"],
    queryFn: async () => {
      const storedUser = localStorage.getItem("wf_hybrid_user");
      const wasExplicitlyLoggedOut = localStorage.getItem(
        "explicitly_logged_out"
      );

      // Return initial state if no stored user or logged out
      if (!storedUser || wasExplicitlyLoggedOut) {
        return { user: { firstName: "", email: "" }, sessionToken: "" };
      }

      try {
        const userData = JSON.parse(storedUser);
        if (!userData.sessionToken) {
          return { user: { firstName: "", email: "" }, sessionToken: "" };
        }

        // Decode and validate token
        const decodedToken = jwtDecode(userData.sessionToken) as DecodedToken;
        if (decodedToken.exp * 1000 <= Date.now()) {
          // Token expired - clear storage
          localStorage.removeItem("wf_hybrid_user");
          return { user: { firstName: "", email: "" }, sessionToken: "" };
        }

        // Return valid auth state
        return {
          user: {
            firstName: decodedToken.user.firstName,
            email: decodedToken.user.email,
          },
          sessionToken: userData.sessionToken,
        };
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        // Clear invalid data
        localStorage.removeItem("wf_hybrid_user");
        return { user: { firstName: "", email: "" }, sessionToken: "" };
      }
    },
    staleTime: Infinity, // Never consider the data stale
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Mutation for exchanging ID token for session token
  const tokenMutation = useMutation({
    mutationFn: async (idToken: string) => {
      // Get site info from Webflow
      const siteInfo = await webflow.getSiteInfo();
      console.log("Got site info:", siteInfo.siteId);

      // Exchange token with backend
      console.log("Sending token exchange request to backend...");
      const response = await fetch(`${base_url}/api/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: idToken, siteId: siteInfo.siteId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Token exchange API error:", errorData);
        throw new Error(
          `Failed to exchange token: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      console.log("Token exchange API response:", data.sessionToken ? "Got session token" : "No session token in response");
      
      if (!data.sessionToken) {
        throw new Error("No session token received");
      }

      return data;
    },
    onSuccess: (data) => {
      try {
        console.log("Token exchange successful, processing response...");
        // Decode the new token
        const decodedToken = jwtDecode(data.sessionToken) as DecodedToken;
        console.log("Token decoded, user info:", 
          decodedToken.user ? {
            firstName: decodedToken.user.firstName,
            email: decodedToken.user.email
          } : "No user in token");
          
        const userData = {
          sessionToken: data.sessionToken,
          firstName: decodedToken.user.firstName,
          email: decodedToken.user.email,
          exp: decodedToken.exp,
        };

        // Update localStorage
        console.log("Saving user data to localStorage");
        localStorage.setItem("wf_hybrid_user", JSON.stringify(userData));
        localStorage.removeItem("explicitly_logged_out");

        // Directly update the query data instead of invalidating
        console.log("Updating auth state in query cache");
        queryClient.setQueryData<AuthState>(["auth"], {
          user: {
            firstName: decodedToken.user.firstName,
            email: decodedToken.user.email,
          },
          sessionToken: data.sessionToken,
        });
        
        console.log("Auth state update complete");
      } catch (error) {
        console.error("Error processing token response:", error);
      }
    },
  });

  // Function to initiate token exchange process
  const exchangeAndVerifyIdToken = async () => {
    console.log("Starting token exchange process...");
    
    // Clear existing auth data to ensure a fresh start
    localStorage.removeItem("explicitly_logged_out");
    
    // Check if we already have a valid session token
    const storedUser = localStorage.getItem("wf_hybrid_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.sessionToken) {
          const decodedToken = jwtDecode(userData.sessionToken) as DecodedToken;
          if (decodedToken.exp * 1000 > Date.now()) {
            console.log("Found valid token in localStorage, using it");
            // Refresh query cache with existing token
            queryClient.setQueryData<AuthState>(["auth"], {
              user: {
                firstName: decodedToken.user.firstName,
                email: decodedToken.user.email,
              },
              sessionToken: userData.sessionToken,
            });
            // Force a refresh of the query
            queryClient.invalidateQueries({ queryKey: ["auth"] });
            return userData.sessionToken;
          } else {
            console.log("Stored token has expired, getting new one");
            // Clear expired token
            localStorage.removeItem("wf_hybrid_user");
          }
        }
      } catch (error) {
        console.error("Error checking stored token:", error);
        // Clear invalid data
        localStorage.removeItem("wf_hybrid_user");
      }
    } else {
      console.log("No stored user found in localStorage");
    }

    if (isExchangingToken.current) {
      console.log("Token exchange already in progress");
      return "";
    }

    try {
      isExchangingToken.current = true;
      // Small delay to prevent rapid retries
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get new ID token from Webflow
      console.log("Getting ID token from Webflow...");
      const idToken = await webflow.getIdToken();
      console.log("ID token received:", idToken ? "Token received" : "No token received");

      // Validate token format
      if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
        throw new Error("Invalid or missing ID token");
      }

      // Exchange token using mutation
      console.log("Exchanging token with backend...");
      const response = await tokenMutation.mutateAsync(idToken);
      console.log("Token exchange completed successfully");
      
      // Force a refresh of the query to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      
      return response.sessionToken;
    } catch (error) {
      console.error("Detailed error in token exchange:", error);
      // Clear storage on error to force re-auth
      localStorage.removeItem("wf_hybrid_user");
      return "";
    } finally {
      isExchangingToken.current = false;
    }
  };

  // Function to handle user logout
  const logout = () => {
    // Set logout flag and clear storage
    localStorage.setItem("explicitly_logged_out", "true");
    localStorage.removeItem("wf_hybrid_user");
    queryClient.setQueryData(["auth"], {
      user: { firstName: "", email: "" },
      sessionToken: "",
    });
    queryClient.clear();
  };

  return {
    user: authState?.user || { firstName: "", email: "" },
    sessionToken: authState?.sessionToken || "",
    isAuthLoading,
    exchangeAndVerifyIdToken,
    logout,
  };
}
