import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { green } from "@mui/material/colors";
import { useAuth } from "../hooks/useAuth";
import { useFiles } from "../hooks/useFiles";

interface SiteWideCodeManagerProps {
  siteId: string;
}

interface SiteCodeData {
  head_code: ScriptInfo[];
  body_code: ScriptInfo[];
}

interface ScriptInfo {
  id: string;
  name: string;
  version?: string;
  location?: "header" | "footer";
}

export function SiteWideCodeManager({ siteId }: SiteWideCodeManagerProps) {
  const { sessionToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [siteCode, setSiteCode] = useState<SiteCodeData>({
    head_code: [],
    body_code: [],
  });
  // Store original site code to check for changes
  const [originalSiteCode, setOriginalSiteCode] = useState<SiteCodeData>({
    head_code: [],
    body_code: [],
  });
  const [selectedFileId, setSelectedFileId] = useState<string | "">("");
  const [selectedLocation, setSelectedLocation] = useState<"header" | "footer">("header");
  const [expanded, setExpanded] = useState<boolean>(true);
  const [apiAttempted, setApiAttempted] = useState(false);
  
  // Get files from the existing hook
  const {
    files,
    isLoading: filesLoading,
    apiDisabled,
  } = useFiles(siteId, sessionToken || "");
  
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;

  // Fetch current site code data
  useEffect(() => {
    // Skip if we've already attempted API call and the API is disabled
    if (apiAttempted && apiDisabled) {
      setIsLoading(false);
      return;
    }

    async function fetchSiteData() {
      if (!siteId || !sessionToken) return;
      
      try {
        setIsLoading(true);
        setApiAttempted(true);
        
        // Try a direct query to get specific site data
        const siteResponse = await fetch(`${base_url}/api/supabase-sites/site?id=${siteId}`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }).catch(err => {
          console.error("Error fetching site data:", err);
          return null;
        });

        let currentSite = null;
        
        // If direct query worked, use that data
        if (siteResponse && siteResponse.ok) {
          const siteData = await siteResponse.json();
          currentSite = siteData.data;
        } else if (!apiDisabled) {
          // Only attempt this fallback if API isn't disabled
          try {
            // Otherwise fall back to the list method
            // Fetch site data from Supabase
            const response = await fetch(`${base_url}/api/supabase-sites`, {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              const sites = data.data || [];
              
              // Find the current site
              currentSite = sites.find((site: any) => site.webflow_site_id === siteId);
            }
          } catch (error) {
            console.error("Error fetching site data:", error);
            setErrorMessage("Could not connect to API server");
          }
        }
        
        if (currentSite) {
          // Check for alternate field names (backward compatibility)
          const headCodeField = 
            currentSite.head_code !== undefined ? 'head_code' : 
            currentSite.headCode !== undefined ? 'headCode' :
            currentSite.head_files !== undefined ? 'head_files' : 'head_code';
            
          const bodyCodeField = 
            currentSite.body_code !== undefined ? 'body_code' : 
            currentSite.bodyCode !== undefined ? 'bodyCode' :
            currentSite.body_files !== undefined ? 'body_files' : 'body_code';
          
          // Handle different possible formats from Supabase
          let rawHeadIds: number[] = [];
          let rawBodyIds: number[] = [];
          
          // Process head_code based on type
          if (Array.isArray(currentSite[headCodeField])) {
            rawHeadIds = currentSite[headCodeField].map((item: any) => {
              // Handle both objects and plain numbers
              return typeof item === 'object' && item !== null ? Number(item.id) : Number(item);
            });
          } else if (typeof currentSite[headCodeField] === 'string') {
            try {
              // Try parsing as JSON if it's a string
              const parsed = JSON.parse(currentSite[headCodeField]);
              rawHeadIds = Array.isArray(parsed) ? parsed.map((item: any) => {
                return typeof item === 'object' && item !== null ? Number(item.id) : Number(item);
              }) : [];
            } catch (e) {
              console.error(`Error parsing ${headCodeField}:`, e);
            }
          }
          
          // Process body_code based on type
          if (Array.isArray(currentSite[bodyCodeField])) {
            rawBodyIds = currentSite[bodyCodeField].map((item: any) => {
              // Handle both objects and plain numbers
              return typeof item === 'object' && item !== null ? Number(item.id) : Number(item);
            });
          } else if (typeof currentSite[bodyCodeField] === 'string') {
            try {
              // Try parsing as JSON if it's a string
              const parsed = JSON.parse(currentSite[bodyCodeField]);
              rawBodyIds = Array.isArray(parsed) ? parsed.map((item: any) => {
                return typeof item === 'object' && item !== null ? Number(item.id) : Number(item);
              }) : [];
            } catch (e) {
              console.error(`Error parsing ${bodyCodeField}:`, e);
            }
          }
          
          // Filter out any invalid values
          rawHeadIds = rawHeadIds.filter(id => !isNaN(id) && id !== null && id !== undefined);
          rawBodyIds = rawBodyIds.filter(id => !isNaN(id) && id !== null && id !== undefined);
          
          // Create placeholder objects with IDs
          const headCode: ScriptInfo[] = rawHeadIds.map((id: number) => {
            // Look for file in the files array to get the correct name
            const file = files.find(f => String(f.id) === String(id));
            return {
              id: String(id),
              name: file ? file.name : `File #${id}`,
              location: "header"
            };
          });
          
          const bodyCode: ScriptInfo[] = rawBodyIds.map((id: number) => {
            // Look for file in the files array to get the correct name  
            const file = files.find(f => String(f.id) === String(id));
            return {
              id: String(id),
              name: file ? file.name : `File #${id}`,
              location: "footer"
            };
          });
          
          // Set both current and original state
          const initialState = {
            head_code: headCode,
            body_code: bodyCode,
          };
          
          setSiteCode(initialState);
          setOriginalSiteCode(JSON.parse(JSON.stringify(initialState)));
        } else if (!apiDisabled) {
          console.warn("No site found matching siteId:", siteId);
        }
      } catch (error) {
        console.error("Error fetching site data:", error);
        setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSiteData();
  }, [siteId, sessionToken, base_url, apiDisabled, apiAttempted]);
  
  // Update file names when files are loaded - only runs when files change
  useEffect(() => {
    if (filesLoading || files.length === 0) {
      return;
    }
    
    // Only update if we have site code loaded already
    if (siteCode.head_code.length === 0 && siteCode.body_code.length === 0) {
      return;
    }
    
    // Deep copy current state to avoid reference issues
    const currentHeadCode = [...siteCode.head_code];
    const currentBodyCode = [...siteCode.body_code];
    
    // Create a lookup for file details
    const filesLookup: Record<string, any> = {};
    files.forEach(file => {
      filesLookup[String(file.id)] = file;
    });
    
    // Update file names
    let hasChanges = false;
    
    currentHeadCode.forEach((fileInfo, index) => {
      const fileData = filesLookup[fileInfo.id];
      if (fileData && fileInfo.name === `File #${fileInfo.id}`) {
        currentHeadCode[index] = {
          ...fileInfo,
          name: fileData.name || `File #${fileInfo.id}`
        };
        hasChanges = true;
      }
    });
    
    currentBodyCode.forEach((fileInfo, index) => {
      const fileData = filesLookup[fileInfo.id];
      if (fileData && fileInfo.name === `File #${fileInfo.id}`) {
        currentBodyCode[index] = {
          ...fileInfo,
          name: fileData.name || `File #${fileInfo.id}`
        };
        hasChanges = true;
      }
    });
    
    // Only update state if we made changes
    if (hasChanges) {
      setSiteCode({
        head_code: currentHeadCode,
        body_code: currentBodyCode
      });
    }
  }, [files, filesLoading, siteCode]);
  
  // Helpers for reordering
  const moveUp = (list: ScriptInfo[], idx: number) => {
    if (idx === 0) return list;
    const newList = [...list];
    [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
    return newList;
  };
  
  const moveDown = (list: ScriptInfo[], idx: number) => {
    if (idx === list.length - 1) return list;
    const newList = [...list];
    [newList[idx + 1], newList[idx]] = [newList[idx], newList[idx + 1]];
    return newList;
  };
  
  // Handle adding a file to site-wide code
  const handleAddFile = () => {
    if (!selectedFileId || !siteId) return;
    
    const fileToAdd = files.find(f => String(f.id) === selectedFileId);
    if (!fileToAdd) return;
    
    // Create script info - just for local state tracking
    const scriptInfo = {
      id: String(fileToAdd.id),
      name: fileToAdd.name,
      location: selectedLocation,
    };
    
    // Update local state
    if (selectedLocation === "header") {
      setSiteCode({
        ...siteCode,
        head_code: [...siteCode.head_code, scriptInfo]
      });
    } else {
      setSiteCode({
        ...siteCode,
        body_code: [...siteCode.body_code, scriptInfo]
      });
    }
    
    // Clear selection
    setSelectedFileId("");
  };
  
  // Handle removing a file
  const handleRemoveFile = (location: "header" | "footer", fileId: string) => {
    if (location === "header") {
      setSiteCode({
        ...siteCode,
        head_code: siteCode.head_code.filter(f => f.id !== fileId)
      });
    } else {
      setSiteCode({
        ...siteCode,
        body_code: siteCode.body_code.filter(f => f.id !== fileId)
      });
    }
  };
  
  // Save changes to Supabase
  const saveChanges = async () => {
    if (!siteId) return;
    
    try {
      setSaveStatus("saving");
      
      // Convert to arrays of just IDs (as numbers) for Supabase storage
      const headIdsForSave = siteCode.head_code.map(file => Number(file.id));
      const bodyIdsForSave = siteCode.body_code.map(file => Number(file.id));
      
      // Update Supabase
      const response = await fetch(`${base_url}/api/supabase-sites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          webflow_site_id: siteId,
          head_code: headIdsForSave,
          body_code: bodyIdsForSave,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update site data: ${response.statusText}`);
      }
      
      // Update original state to match current state
      setOriginalSiteCode(JSON.parse(JSON.stringify(siteCode)));
      
      setSaveStatus("success");
      
      // Reset success status after a delay
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error updating site data:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      setSaveStatus("error");
    }
  };
  
  // Discard changes
  const discardChanges = () => {
    // Reset to original state
    setSiteCode(JSON.parse(JSON.stringify(originalSiteCode)));
  };
  
  // Check if there are unsaved changes
  const hasChanges = () => {
    // Compare head_code arrays
    if (originalSiteCode.head_code.length !== siteCode.head_code.length) {
      return true;
    }
    
    // Compare body_code arrays
    if (originalSiteCode.body_code.length !== siteCode.body_code.length) {
      return true;
    }
    
    // Compare each item in head_code
    for (let i = 0; i < originalSiteCode.head_code.length; i++) {
      if (originalSiteCode.head_code[i].id !== siteCode.head_code[i].id) {
        return true;
      }
    }
    
    // Compare each item in body_code
    for (let i = 0; i < originalSiteCode.body_code.length; i++) {
      if (originalSiteCode.body_code[i].id !== siteCode.body_code[i].id) {
        return true;
      }
    }
    
    return false;
  };
  
  // Get file details by ID
  const getFileDetails = (fileId: string) => {
    return files.find(f => String(f.id) === fileId);
  };
  
  // Get language color for code language
  const getLanguageColor = (language: string) => {
    switch (language.toLowerCase()) {
      case 'js':
        return { main: '#F7DF1E', light: 'rgba(247, 223, 30, 0.12)' };
      case 'css':
        return { main: '#264de4', light: 'rgba(38, 77, 228, 0.12)' };
      case 'html':
        return { main: '#e34c26', light: 'rgba(227, 76, 38, 0.12)' };
      default:
        return { main: '#aaa', light: 'rgba(170, 170, 170, 0.12)' };
    }
  };

  // Render file item with reordering controls
  const renderFileItem = (file: ScriptInfo, idx: number, location: "header" | "footer") => {
    const fileDetails = getFileDetails(file.id);
    const langColor = fileDetails 
      ? getLanguageColor(fileDetails.language) 
      : { main: '#aaa', light: 'rgba(170, 170, 170, 0.12)' };
    
    const list = location === "header" ? siteCode.head_code : siteCode.body_code;
    const setList = (newList: ScriptInfo[]) => {
      if (location === "header") {
        setSiteCode({ ...siteCode, head_code: newList });
      } else {
        setSiteCode({ ...siteCode, body_code: newList });
      }
    };
    
    return (
      <Paper 
        elevation={0} 
        sx={{
          p: 1.5,
          mb: 1,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          transition: 'all 0.2s ease',
          border: '1px solid transparent',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
        key={file.id}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CodeIcon sx={{ color: langColor.main, opacity: 0.9 }} />
          <Box>
            <Typography 
              sx={{ 
                fontWeight: 500, 
                color: 'white',
                fontSize: '0.95rem',
                mb: 0.5
              }}
            >
              {file.name}
            </Typography>
            <Chip
              label={fileDetails?.language?.toUpperCase() || "CODE"}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 600,
                backgroundColor: langColor.light,
                color: langColor.main,
                letterSpacing: '0.5px'
              }}
            />
          </Box>
        </Box>
        
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Move up">
            <span>
              <IconButton 
                size="small" 
                onClick={() => setList(moveUp(list, idx))} 
                disabled={idx === 0}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  '&:hover': { 
                    color: 'white', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)' 
                  },
                  '&.Mui-disabled': { 
                    color: 'rgba(255, 255, 255, 0.2)' 
                  },
                  p: 0.75
                }}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Move down">
            <span>
              <IconButton 
                size="small" 
                onClick={() => setList(moveDown(list, idx))} 
                disabled={idx === list.length - 1}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  '&:hover': { 
                    color: 'white', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)' 
                  },
                  '&.Mui-disabled': { 
                    color: 'rgba(255, 255, 255, 0.2)' 
                  },
                  p: 0.75
                }}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Remove">
            <IconButton 
              size="small" 
              onClick={() => handleRemoveFile(location, file.id)}
              sx={{
                color: '#ff5252',
                opacity: 0.7,
                '&:hover': { 
                  color: '#ff5252', 
                  backgroundColor: 'rgba(255, 80, 80, 0.1)',
                  opacity: 1
                },
                p: 0.75
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>
    );
  };

  // Render the list of files for a location
  const renderFilesList = (location: "header" | "footer") => {
    const files = location === "header" ? siteCode.head_code : siteCode.body_code;
    
    if (files.length === 0) {
      return (
        <Box 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: 2,
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography 
            color="text.secondary" 
            variant="body2"
            sx={{ fontStyle: 'italic' }}
          >
            No {location === "header" ? "head" : "body"} files added
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mt: 1 }}>
        {files.map((file, idx) => renderFileItem(file, idx, location))}
      </Box>
    );
  };

  // Show loading state or API error message
  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          Loading site-wide code...
        </Typography>
      </Box>
    );
  }
  
  if (apiDisabled) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert 
          severity="warning"
          sx={{ mb: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', color: 'rgba(255, 152, 0, 0.8)' }}
        >
          API connection unavailable. Please check your API server.
        </Alert>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Site-wide code functionality is disabled.
        </Typography>
      </Box>
    );
  }

  // Determine if save button should be disabled
  const isSaveDisabled = saveStatus === "saving" || !hasChanges();

  return (
    <Box>
      {/* Status messages */}
      {saveStatus === "error" && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setSaveStatus("idle")}
        >
          {errorMessage || "Failed to update site-wide code"}
        </Alert>
      )}
      
      {saveStatus === "success" && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          onClose={() => setSaveStatus("idle")}
        >
          Site-wide code updated successfully
        </Alert>
      )}
      
      {/* Add file form */}
      <Box
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'white' }}>
            Add File to Site
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {hasChanges() && (
              <Tooltip title="Discard changes">
                <IconButton
                  onClick={discardChanges}
                  sx={{
                    color: '#ff5252',
                    p: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 82, 82, 0.1)'
                    }
                  }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Button 
              variant="contained" 
              onClick={saveChanges} 
              disabled={isSaveDisabled}
              startIcon={saveStatus === "saving" ? <CircularProgress size={16} /> : <SaveIcon />}
              sx={{
                backgroundColor: isSaveDisabled ? 'rgba(255, 255, 255, 0.1)' : '#006acc',
                color: isSaveDisabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
                py: 0.6,
                px: 1.8,
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.85rem',
                borderRadius: 1.5,
                boxShadow: isSaveDisabled ? 'none' : '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset',
                '&:hover': {
                  backgroundColor: isSaveDisabled ? 'rgba(255, 255, 255, 0.15)' : '#0088ff',
                  boxShadow: isSaveDisabled ? 'none' : '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              {saveStatus === "saving" ? "Saving..." : "Save changes"}
            </Button>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2} alignItems="center">
          {/* File selector with custom styling */}
          <FormControl sx={{ flex: 1 }}>
            <Select
              displayEmpty
              value={selectedFileId}
              onChange={(e) => setSelectedFileId(e.target.value)}
              renderValue={(selected) => {
                if (!selected) {
                  return <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>Select a file...</Typography>;
                }
                
                const file = files.find(f => String(f.id) === selected);
                const langColor = file ? getLanguageColor(file.language) : { main: '#aaa', light: 'rgba(170, 170, 170, 0.12)' };
                
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                    <Chip
                      label={file?.language.toUpperCase() || "FILE"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        backgroundColor: langColor.light,
                        color: langColor.main,
                      }}
                    />
                    <Typography sx={{ fontWeight: 500 }}>
                      {file?.name || "Selected File"}
                    </Typography>
                  </Box>
                );
              }}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                height: '40px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  py: 0.75,
                  px: 1.5,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.5)',
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: { 
                    maxHeight: 300,
                    mt: 0.5,
                    backgroundColor: '#1c1c1c',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 2,
                  }
                }
              }}
            >
              {files.map((file) => {
                const langColor = getLanguageColor(file.language);
                return (
                  <MenuItem 
                    key={file.id} 
                    value={String(file.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 1.25,
                      px: 1.5,
                      borderRadius: 1,
                      my: 0.5,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <CodeIcon sx={{ color: langColor.main }} />
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" noWrap>
                        {file.name}
                      </Typography>
                      <Chip
                        label={file.language.toUpperCase()}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          backgroundColor: langColor.light,
                          color: langColor.main,
                          mt: 0.5
                        }}
                      />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          
          {/* Location selector with custom styling */}
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value as "header" | "footer")}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                height: '40px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '& .MuiSelect-select': {
                  py: 0.75,
                  px: 1.5,
                  fontWeight: 500,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.5)',
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: { 
                    backgroundColor: '#1c1c1c',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 2,
                  }
                }
              }}
            >
              <MenuItem value="header">Head</MenuItem>
              <MenuItem value="footer">Body</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddFile}
            disabled={!selectedFileId}
            sx={{ 
              minWidth: 100,
              height: '40px',
              padding: '9px 16px'
            }}
          >
            Add
          </Button>
        </Stack>
      </Box>
      
      {/* Display lists of files for each location */}
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.07)',
          overflow: 'hidden'
        }}
      >
        {/* Head section */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'white' }}>
              Head Code
            </Typography>
            <Chip 
              label={`${siteCode.head_code.length} ${siteCode.head_code.length === 1 ? 'file' : 'files'}`} 
              size="small" 
              sx={{ 
                height: 22, 
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 500,
                fontSize: '0.7rem',
                px: 0.5,
                borderRadius: '4px'
              }} 
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
            Files added to the site's head (inside &lt;head&gt; tag)
          </Typography>
          
          {renderFilesList("header")}
        </Box>
        
        {/* Body section */}
        <Box
          sx={{
            p: 3
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'white' }}>
              Body Code
            </Typography>
            <Chip 
              label={`${siteCode.body_code.length} ${siteCode.body_code.length === 1 ? 'file' : 'files'}`} 
              size="small" 
              sx={{ 
                height: 22, 
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 500,
                fontSize: '0.7rem',
                px: 0.5,
                borderRadius: '4px'
              }} 
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
            Files added to the end of the site's body (before closing &lt;/body&gt; tag)
          </Typography>
          
          {renderFilesList("footer")}
        </Box>
      </Box>
    </Box>
  );
}