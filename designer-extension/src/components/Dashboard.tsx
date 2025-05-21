import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from "@mui/material";
import { LoadingStates } from "./LoadingStates.tsx";
import DataTable from "./DataTable";
import { Site } from "../types/types.ts";
import { useAuth } from "../hooks/useAuth";
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LanguageIcon from '@mui/icons-material/Language';
import { FilesSection } from "./FilesSection";
import { PageFileManager } from "./PageFileManager";
import { useDevTools } from "../hooks/useDevTools";

interface DashboardProps {
  user: { firstName: string };
  sites: Site[];
  isLoading: boolean;
  isError: boolean;
  error: string;
  onFetchSites: () => void;
  logout: () => void;
  setHasClickedFetch: (value: boolean) => void;
}

/**
 * Dashboard Component
 *
 * The main interface after user authentication. This component:
 * 1. Welcomes the user with their first name
 * 2. Displays the currently active Webflow site
 * 3. Provides a button to sync pages for the current site
 */
export function Dashboard({
  user,
  sites,
  isLoading,
  isError,
  error,
  onFetchSites,
  logout,
  setHasClickedFetch
}: DashboardProps) {
  // Get the authentication token
  const { sessionToken } = useAuth();
  const { clearSession, logStorage } = useDevTools({
    logout,
    setHasClickedFetch,
  });
  
  // Get the base URL for API calls
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;
  
  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [debugResult, setDebugResult] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">("checking");
  const [devMode] = useState(import.meta.env.MODE === 'development');
  
  // Get the current site automatically on load
  useEffect(() => {
    if (!isLoading && sites && sites.length > 0 && !currentSite) {
      setCurrentSite(sites[0]);
    }
  }, [sites, isLoading, currentSite]);

  // Reset success state after 3 seconds
  useEffect(() => {
    if (syncSuccess) {
      const timer = setTimeout(() => {
        setSyncSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [syncSuccess]);
  
  // Debug function to check site details
  const handleDebugSites = async () => {
    if (!currentSite) {
      alert("No site available. Please reload the app.");
      return;
    }
    
    try {
      // Call our debug endpoint using the correct base URL
      const response = await fetch(`${base_url}/api/pages/debug?siteId=${currentSite.id}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Debug request failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      setDebugResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Debug error:", error);
      alert(`Debug error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Sync pages for the current site
  const handleRefreshPages = async () => {
    if (!currentSite) {
      alert("No site available. Please reload the app.");
      return;
    }
    
    // Check for authentication token
    if (!sessionToken) {
      alert("Authentication required. Please reload the app.");
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // Call API with the site ID and auth token
      const response = await fetch(`${base_url}/api/pages/sync?siteId=${currentSite.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      const responseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        alert("Invalid response from server. See console for details.");
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to sync pages: ${response.statusText}`);
      }
      
      setSyncSuccess(true);
    } catch (error) {
      console.error('Error syncing pages:', error);
      alert(`Failed to sync pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearClick = () => {
    clearSession();
    window.location.reload(); // Force a complete refresh after clearing
  };

  const handleLogout = () => {
    logout();
    window.location.reload(); // Refresh to show login screen
  };

  // Check API connection in development mode
  useEffect(() => {
    // Only check in development mode
    if (!devMode) {
      setApiStatus("ok");
      return;
    }
    
    const checkApi = async () => {
      try {
        const resp = await fetch(`${base_url}/api/health-check`, { 
          method: 'HEAD',
          // Quick timeout to avoid hanging
          signal: AbortSignal.timeout(2000)
        }).catch(() => null);
        
        setApiStatus(resp && resp.ok ? "ok" : "error");
      } catch (e) {
        setApiStatus("error");
      }
    };
    
    checkApi();
  }, [devMode, base_url]);

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 2 }}>
      {/* Show development API status if needed */}
      {devMode && apiStatus === "error" && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 4,
            backgroundColor: 'rgba(255, 152, 0, 0.1)', 
            color: '#f57c00',
            borderRadius: 2,
            border: '1px solid rgba(255, 152, 0, 0.2)',
            '& .MuiAlert-icon': { color: '#f57c00' }
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              API Server Not Running
            </Typography>
            <Typography variant="body2">
              The API server at <code>{base_url}</code> is not responding. Start your API server or the app will encounter errors.
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 1 }}>
                # Start your API server with:
                <br />
                cd data-client && npm run dev
              </Typography>
            </Box>
          </Box>
        </Alert>
      )}

      {/* Hello Julian */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <img 
                src="/assets/codone-long-white.svg" 
                alt="Codone" 
                style={{ height: 15, marginRight: 16 }} 
              />
            </Box>
            <Typography variant="h1" sx={{ mb: 0.5, color: 'text.primary' }}>
              Hello, {user.firstName} 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome to your Codone - your Webflow code manager!
            </Typography>
          </Grid>
          <Grid item xs={12} sm={5} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            {currentSite && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                px: 2, 
                py: 1, 
                bgcolor: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: 'divider' 
              }}>
                <LanguageIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Current site</Typography>
                  <Typography variant="body2" fontWeight={500} color="text.primary">{currentSite.displayName}</Typography>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Page Code Manager */}
      {currentSite && (
        <PageFileManager siteId={currentSite.id} />
      )}

      {/* Site files */}
      {currentSite && (
        <FilesSection siteId={currentSite.id} />
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Site Management */}
        <Grid item xs={12} md={8}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              height: '100%',
              bgcolor: 'background.paper'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" gutterBottom color="text.primary">
                Site Management
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Synchronize and manage your Webflow site's content and pages
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  startIcon={isRefreshing ? <CircularProgress size={20} color="inherit" /> : syncSuccess ? <CheckCircleIcon /> : <RefreshIcon />}
                  onClick={handleRefreshPages}
                  disabled={isRefreshing || !currentSite}
                  sx={{ 
                    px: 2.5,
                    py: 0.8,
                    fontSize: '0.85rem',
                    boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset'
                  }}
                >
                  {isRefreshing ? "Synchronizing..." : syncSuccess ? "Success!" : "Sync Pages"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Site Details */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider',
              height: '100%',
              bgcolor: 'background.paper'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" gutterBottom color="text.primary">
                Site Details
              </Typography>
              
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : isError ? (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              ) : currentSite ? (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Site ID
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }} color="text.primary">
                        {currentSite.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label="Connected" 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(67, 83, 255, 0.2)', 
                            color: '#4353ff',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }} 
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tooltip title="Debug site data">
                          <IconButton 
                            onClick={handleDebugSites}
                            disabled={!currentSite}
                            sx={{ 
                              border: '1px solid', 
                              borderColor: 'divider',
                              borderRadius: 1.5,
                              p: 1,
                              color: 'text.secondary'
                            }}
                          >
                            <BugReportIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.75rem' }}>
                        If you are having issues, please send all this data in an email to juliangalluzzois@gmail.com
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No site data available</Typography>
              )}
              
              {debugResult && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" color="text.secondary">Debug Output</Typography>
                  <Box 
                    sx={{ 
                      mt: 1,
                      p: 1.5, 
                      backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                      borderRadius: 1,
                      maxHeight: '140px',
                      overflow: 'auto',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'rgba(255, 255, 255, 0.9)',
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                      },
                    }}
                  >
                    <pre style={{ margin: 0 }}>{debugResult}</pre>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Development Tools */}
        <Grid item xs={12} mt={2}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" gutterBottom color="text.primary">
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
