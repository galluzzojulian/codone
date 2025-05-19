import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Stack,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputBase,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import CodeIcon from "@mui/icons-material/Code";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../hooks/useAuth";
import { useFiles } from "../hooks/useFiles";
import { usePages } from "../hooks/usePages";

interface PageFileManagerProps {
  siteId: string;
}

interface SupabasePage {
  id: string;
  webflow_page_id: string;
  name: string;
  head_files: string[];
  body_files: string[];
}

export function PageFileManager({ siteId }: PageFileManagerProps) {
  const theme = useTheme();
  const { sessionToken } = useAuth();
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;

  // fetch pages & files using existing hooks
  const { data: pages = [], isLoading: pagesLoading } = usePages(siteId);
  const {
    files,
    isLoading: filesLoading,
    apiDisabled,
  } = useFiles(siteId, sessionToken || "");

  // Track API attempt to prevent repeated failures
  const [apiAttempted, setApiAttempted] = useState(false);

  // Selected page
  const [selectedPageId, setSelectedPageId] = useState<string | "">("");

  // local state lists
  const [headList, setHeadList] = useState<string[]>([]);
  const [bodyList, setBodyList] = useState<string[]>([]);

  // Tab selection
  const [activeTab, setActiveTab] = useState<"page" | "site">("page");

  // Save status
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  
  const [sbPages, setSbPages] = useState<SupabasePage[]>([]);

  // Create a mapping between Webflow page IDs and Supabase page IDs
  const [pageMapping, setPageMapping] = useState<Record<string, string>>({});

  // Track current Webflow page
  const [currentWebflowPageId, setCurrentWebflowPageId] = useState<string | null>(null);

  // Search terms for file filters
  const [headFileSearch, setHeadFileSearch] = useState("");
  const [bodyFileSearch, setBodyFileSearch] = useState("");

  // Get current page ID from Webflow
  useEffect(() => {
    async function getCurrentPage() {
      try {
        const currentPage = await webflow.getCurrentPage();
        if (currentPage) {
          const pageId = currentPage.id;
          setCurrentWebflowPageId(pageId);
        }
      } catch (e) {
        console.error("Error getting current Webflow page:", e);
      }
    }
    
    getCurrentPage();
  }, []);

  // fetch supabase pages list once
  useEffect(() => {
    // Skip if already attempted and API is disabled
    if (apiAttempted && apiDisabled) return;

    async function fetchSbPages() {
      if (!siteId || !sessionToken) return;
      setApiAttempted(true);
      
      try {
        const res = await fetch(`${base_url}/api/pages?siteId=${siteId}`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch supabase pages");
        const j = await res.json();
        setSbPages(j.pages || []);
      } catch (e) {
        console.error("Error fetching Supabase pages:", e);
      }
    }
    fetchSbPages();
  }, [siteId, base_url, sessionToken, apiDisabled, apiAttempted]);

  // Build the mapping when both pages lists are loaded
  useEffect(() => {
    if (sbPages.length > 0) {
      const mapping: Record<string, string> = {};
      sbPages.forEach(p => {
        if (p.webflow_page_id) {
          mapping[p.webflow_page_id] = p.id;
        }
      });
      setPageMapping(mapping);
    }
  }, [sbPages]);

  // When pages fetched set default page
  useEffect(() => {
    if (!pagesLoading && pages.length > 0 && !selectedPageId) {
      // If we have the current page ID, select that
      if (currentWebflowPageId) {
        const currentWebflowPage = pages.find(p => p.id === currentWebflowPageId);
        if (currentWebflowPage) {
          setSelectedPageId(currentWebflowPageId);
          return;
        }
      }
      
      // Fallback: select first page
      setSelectedPageId(pages[0].id);
    }
  }, [pagesLoading, pages, selectedPageId, currentWebflowPageId]);

  // Fetch page details when selectedPageId changes - with better error handling and stability
  useEffect(() => {
    if (!selectedPageId || !sbPages.length) return;
    
    // Use our mapping to find the correct Supabase page ID
    const sbPageId = pageMapping[selectedPageId];
    
    // Find the page in our sbPages list
    const sbPage = sbPageId ? sbPages.find(p => p.id === sbPageId) : null;
    
    if (sbPage) {
      // Parse arrays from various possible formats
      let headIds: string[] = [];
      let bodyIds: string[] = [];
      
      // Handle head_files - could be array, JSON string, or null
      try {
        if (Array.isArray(sbPage.head_files)) {
          headIds = sbPage.head_files.map(id => String(id));
        } else if (typeof sbPage.head_files === 'string') {
          // Try to parse as JSON string
          try {
            const parsed = JSON.parse(sbPage.head_files);
            headIds = Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
          } catch (e) {
            console.error("Error parsing head_files JSON:", e);
          }
        } else if (sbPage.head_files) {
          // Last resort - try to convert to array if it's truthy
          headIds = [String(sbPage.head_files)];
        }
      } catch (e) {
        console.error("Error handling head_files:", e);
      }
      
      // Handle body_files - could be array, JSON string, or null
      try {
        if (Array.isArray(sbPage.body_files)) {
          bodyIds = sbPage.body_files.map(id => String(id));
        } else if (typeof sbPage.body_files === 'string') {
          // Try to parse as JSON string
          try {
            const parsed = JSON.parse(sbPage.body_files);
            bodyIds = Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
          } catch (e) {
            console.error("Error parsing body_files JSON:", e);
          }
        } else if (sbPage.body_files) {
          // Last resort - try to convert to array if it's truthy
          bodyIds = [String(sbPage.body_files)];
        }
      } catch (e) {
        console.error("Error handling body_files:", e);
      }
      
      // Only update state if the arrays changed to avoid render loops
      const headChanged = JSON.stringify(headIds) !== JSON.stringify(headList);
      const bodyChanged = JSON.stringify(bodyIds) !== JSON.stringify(bodyList);
      
      if (headChanged) {
        setHeadList(headIds);
      }
      
      if (bodyChanged) {
        setBodyList(bodyIds);
      }
    } else {
      setHeadList([]);
      setBodyList([]);
    }
  }, [selectedPageId, sbPages, pageMapping]);

  // Helpers for reorder
  const moveUp = (list: string[], idx: number) => {
    if (idx === 0) return list;
    const newList = [...list];
    [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
    return newList;
  };
  const moveDown = (list: string[], idx: number) => {
    if (idx === list.length - 1) return list;
    const newList = [...list];
    [newList[idx + 1], newList[idx]] = [newList[idx], newList[idx + 1]];
    return newList;
  };

  // Resets save status after success or error
  useEffect(() => {
    if (saveStatus === "success" || saveStatus === "error") {
      const timer = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const saveChanges = async () => {
    if (!selectedPageId) return;
    
    setSaveStatus("saving");
    
    // Convert IDs back to numbers for Supabase
    const headIdsForSave = headList.map(id => Number(id));
    const bodyIdsForSave = bodyList.map(id => Number(id));

    // Use our mapping to find the correct Supabase page ID
    const sbPageId = pageMapping[selectedPageId];
    if (!sbPageId) {
      console.error("Could not find Supabase page ID for Webflow page:", selectedPageId);
      setSaveStatus("error");
      return;
    }
    
    try {
      const response = await fetch(`${base_url}/api/pages/${sbPageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ head_files: headIdsForSave, body_files: bodyIdsForSave }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to update page:", errorText);
        setSaveStatus("error");
        return;
      }
      
      const result = await response.json();
      
      // update sbPages local state to reflect changes
      const headStr = headIdsForSave.map(id => String(id));
      const bodyStr = bodyIdsForSave.map(id => String(id));
      
      setSbPages(prev => {
        const newPages = prev.map(p => {
          if (p.id === sbPageId) {
            return { ...p, head_files: headStr as any, body_files: bodyStr as any };
          }
          return p;
        });
        return newPages;
      });
      
      setSaveStatus("success");
    } catch (e) {
      console.error("Error saving changes:", e);
      setSaveStatus("error");
    }
  };

  // Reset changes to original state
  const discardChanges = () => {
    if (!selectedPageId) return;
    
    // Get original state of the page
    const sbPageId = pageMapping[selectedPageId];
    const sbPage = sbPageId ? sbPages.find(p => p.id === sbPageId) : null;
    
    if (!sbPage) {
      setHeadList([]);
      setBodyList([]);
      return;
    }
    
    // Convert to string arrays
    let originalHeadFiles: string[] = [];
    let originalBodyFiles: string[] = [];
    
    try {
      if (Array.isArray(sbPage.head_files)) {
        originalHeadFiles = sbPage.head_files.map(id => String(id));
      } else if (typeof sbPage.head_files === 'string') {
        const parsed = JSON.parse(sbPage.head_files);
        originalHeadFiles = Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
      }
      
      if (Array.isArray(sbPage.body_files)) {
        originalBodyFiles = sbPage.body_files.map(id => String(id));
      } else if (typeof sbPage.body_files === 'string') {
        const parsed = JSON.parse(sbPage.body_files);
        originalBodyFiles = Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
      }
    } catch (e) {
      console.error("Error parsing original files:", e);
      originalHeadFiles = [];
      originalBodyFiles = [];
    }
    
    setHeadList(originalHeadFiles);
    setBodyList(originalBodyFiles);
  };
  
  // Has the page been modified
  const hasChanges = () => {
    // If no page selected, there can't be changes
    if (!selectedPageId) return false;
    
    // Get original state of the page
    const sbPageId = pageMapping[selectedPageId];
    const sbPage = sbPageId ? sbPages.find(p => p.id === sbPageId) : null;
    
    if (!sbPage) return true; // If no page found, assume changes needed
    
    // Convert to string arrays for comparison
    let originalHeadFiles: string[] = [];
    let originalBodyFiles: string[] = [];
    
    try {
      if (Array.isArray(sbPage.head_files)) {
        originalHeadFiles = sbPage.head_files.map(id => String(id));
      } else if (typeof sbPage.head_files === 'string') {
        const parsed = JSON.parse(sbPage.head_files);
        originalHeadFiles = Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
      }
      
      if (Array.isArray(sbPage.body_files)) {
        originalBodyFiles = sbPage.body_files.map(id => String(id));
      } else if (typeof sbPage.body_files === 'string') {
        const parsed = JSON.parse(sbPage.body_files);
        originalBodyFiles = Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
      }
    } catch (e) {
      console.error("Error parsing original files:", e);
      return true; // If error, assume changes needed
    }
    
    // Compare arrays (order matters)
    if (originalHeadFiles.length !== headList.length || originalBodyFiles.length !== bodyList.length) {
      return true;
    }
    
    for (let i = 0; i < originalHeadFiles.length; i++) {
      if (originalHeadFiles[i] !== headList[i]) return true;
    }
    
    for (let i = 0; i < originalBodyFiles.length; i++) {
      if (originalBodyFiles[i] !== bodyList[i]) return true;
    }
    
    return false;
  };
  
  // Determine if save button should be disabled
  const isSaveDisabled = !selectedPageId || saveStatus === "saving" || !hasChanges();

  // Get language color for a file
  const getLanguageColor = (language: string) => {
    switch (language.toLowerCase()) {
      case 'html':
        return { main: '#E34C26', light: 'rgba(227, 76, 38, 0.15)' };
      case 'css':
        return { main: '#264DE4', light: 'rgba(38, 77, 228, 0.15)' };
      case 'js':
        return { main: '#F7DF1E', light: 'rgba(247, 223, 30, 0.15)' };
      default:
        return { main: '#4353ff', light: 'rgba(67, 83, 255, 0.15)' };
    }
  };

  // Find a page name by ID
  const getPageName = (id: string) => {
    const page = pages.find((p: any) => p.id === id);
    return page ? page.name : "Unknown Page";
  };
  
  // UI for file item
  const renderFileItem = (fileId: string, idx: number, list: string[], setList: (val: string[]) => void) => {
    const file = files.find((f) => String(f.id) === fileId);
    if (!file) return null;
    
    const langColor = getLanguageColor(file.language);
    
    return (
      <Paper 
        key={`file-item-${fileId}`}
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
              label={file.language.toUpperCase()}
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
          
          <Tooltip title="Remove from page">
            <IconButton 
              size="small" 
              onClick={() => setList(list.filter((_, i) => i !== idx))}
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

  // Get filtered files based on search query
  const getFilteredFiles = (filesList: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return filesList;
    const lowerSearch = searchTerm.toLowerCase();
    return filesList.filter(f => 
      f.name.toLowerCase().includes(lowerSearch) || 
      f.language.toLowerCase().includes(lowerSearch)
    );
  };

  // Loading state
  if (pagesLoading || filesLoading) {
    return (
      <Card 
        sx={{ 
          mt: 4, 
          p: 4, 
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}
      >
        <CircularProgress size={32} sx={{ mb: 2, color: '#4353ff' }} />
        <Typography>Loading page code manager...</Typography>
      </Card>
    );
  }

  // API error state
  if (apiDisabled) {
    return (
      <Card 
        sx={{ 
          mt: 4, 
          p: 4, 
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}
      >
        <Alert 
          severity="warning"
          sx={{ mb: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', color: 'rgba(255, 152, 0, 0.8)' }}
        >
          API connection unavailable. Please check your API server.
        </Alert>
        <Typography color="text.secondary">
          Page code manager functionality is disabled until API server is available.
        </Typography>
      </Card>
    );
  }

  return (
    <Card 
      elevation={0} 
      sx={{ 
        mt: 4,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 3, 
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderBottom: '1px solid',
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 600, 
              color: 'white',
            }}
          >
            Page Code Manager
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
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
                backgroundColor: isSaveDisabled ? 'rgba(255, 255, 255, 0.1)' : '#4353ff',
                color: isSaveDisabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
                py: 1,
                px: 2.5,
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.9rem',
                borderRadius: 1.5,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: isSaveDisabled ? 'rgba(255, 255, 255, 0.15)' : '#3444F0',
                  boxShadow: isSaveDisabled ? 'none' : `0 4px 12px ${alpha('#4353ff', 0.3)}`
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
        
        {/* Page selector with current page highlight */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2
          }}
        >
          <FormControl 
            fullWidth 
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                outline: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
                '&.Mui-focused': {
                  borderColor: 'rgba(67, 83, 255, 0.5)',
                  boxShadow: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },
              '& .MuiSelect-select': {
                py: 1.25,
                px: 2
              }
            }}
          >
            <Select
              value={selectedPageId}
              displayEmpty
              renderValue={(value) => {
                const selectedPage = pages.find((p: any) => p.id === value);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selectedPage ? (
                      <>
                        {selectedPage.id === currentWebflowPageId && (
                          <Chip 
                            label="Current" 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(67, 83, 255, 0.3)', 
                              color: '#ffffff',
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              border: 'none',
                              boxShadow: '0 0 5px rgba(67, 83, 255, 0.5)'
                            }} 
                          />
                        )}
                        <Typography sx={{ fontWeight: 500 }}>
                          {selectedPage.name}
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Select page
                      </Typography>
                    )}
                  </Box>
                );
              }}
              onChange={(e) => setSelectedPageId(e.target.value as string)}
              MenuProps={{
                PaperProps: {
                  sx: { 
                    maxHeight: 300,
                    backgroundColor: '#1c1c1c',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 2,
                  }
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                MenuListProps: {
                  sx: {
                    p: 0,
                    '& .MuiMenuItem-root.Mui-disabled': {
                      opacity: 0.7,
                      color: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: '#292929'
                    }
                  }
                }
              }}
            >
              {pages.map((p: any) => (
                <MenuItem 
                  key={p.id} 
                  value={p.id}
                  sx={{ 
                    py: 1,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    borderRadius: 1,
                    my: 0.5,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(67, 83, 255, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(67, 83, 255, 0.15)'
                      }
                    }
                  }}
                >
                  {p.id === currentWebflowPageId && (
                    <Chip 
                      label="Current" 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(67, 83, 255, 0.3)', 
                        color: '#ffffff',
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        border: 'none',
                        boxShadow: '0 0 5px rgba(67, 83, 255, 0.5)'
                      }} 
                    />
                  )}
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* Content */}
      <Box sx={{ p: 3 }}>
        {saveStatus === "success" && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              backgroundColor: alpha('#4caf50', 0.1),
              color: '#81c784',
              '& .MuiAlert-icon': {
                color: '#81c784'
              }
            }}
          >
            Changes saved successfully
          </Alert>
        )}
        
        {saveStatus === "error" && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: alpha('#f44336', 0.1),
              color: '#e57373',
              '& .MuiAlert-icon': {
                color: '#e57373'
              }
            }}
          >
            Failed to save changes
          </Alert>
        )}
        
        {/* Content in two columns */}
        <Box sx={{ 
          display: { sm: 'grid' },
          gridTemplateColumns: { sm: '1fr 1fr' },
          gap: 3
        }}>
          {/* Head section */}
          <Paper 
            elevation={0} 
            sx={{
              p: 0,
              backgroundColor: 'transparent',
              borderRadius: 2.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              py: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.07)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    letterSpacing: '0.2px'
                  }}
                >
                  &lt;head&gt; Files
                </Typography>
              </Box>
              <Chip 
                label={`${headList.length} ${headList.length === 1 ? 'file' : 'files'}`} 
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
            
            <Box sx={{ p: 2, height: '100%' }}>
              {Array.isArray(headList) && headList.length > 0 ? (
                headList.map((fid, idx) => renderFileItem(fid, idx, headList, setHeadList))
              ) : (
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
                    No head files added
                  </Typography>
                </Box>
              )}
              
              <FormControl 
                fullWidth 
                size="small" 
                sx={{ 
                  mt: headList.length > 0 ? 2 : 3,
                }}
              >
                <Select
                  displayEmpty
                  value=""
                  renderValue={() => (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      color: 'rgba(255, 255, 255, 0.9)',
                      gap: 0.5
                    }}>
                      <AddIcon fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Add head code file
                      </Typography>
                    </Box>
                  )}
                  onChange={(e) => {
                    const val = e.target.value as string;
                    if (val) setHeadList([...headList, val]);
                  }}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 1.5,
                    py: 0.25,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '& .MuiSelect-select': {
                      py: 0.75,
                      px: 1.5,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
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
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    MenuListProps: {
                      sx: {
                        p: 0,
                        '& .MuiMenuItem-root.Mui-disabled': {
                          opacity: 0.7,
                          color: 'rgba(255, 255, 255, 0.5)',
                          backgroundColor: '#292929'
                        }
                      }
                    }
                  }}
                >
                  <Box sx={{ position: 'sticky', top: 0, bgcolor: 'transparent', zIndex: 1, width: '100%' }}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        bgcolor: '#1a1a1a', 
                        borderRadius: 0,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        py: 1,
                        px: 2,
                      }}
                    >
                      <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18 }} />
                      <InputBase
                        placeholder="Search files..."
                        value={headFileSearch}
                        onChange={(e) => setHeadFileSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          ml: 1.5,
                          flex: 1,
                          fontSize: '0.875rem',
                          color: 'white',
                          '& .MuiInputBase-input': {
                            py: 0.75
                          }
                        }}
                      />
                      {headFileSearch && (
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeadFileSearch('');
                          }}
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.5)',
                            p: 0.5,
                            '&:hover': { color: 'white' }
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  
                  {getFilteredFiles(files.filter((f) => !headList.includes(String(f.id))), headFileSearch)
                    .map((f) => {
                      const langColor = getLanguageColor(f.language);
                      return (
                        <MenuItem 
                          key={f.id} 
                          value={String(f.id)}
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
                              {f.name}
                            </Typography>
                            <Chip
                              label={f.language.toUpperCase()}
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
            </Box>
          </Paper>
          
          {/* Body section */}
          <Paper 
            elevation={0} 
            sx={{
              p: 0,
              backgroundColor: 'transparent',
              borderRadius: 2.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              py: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.07)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    letterSpacing: '0.2px'
                  }}
                >
                  &lt;body&gt; Files
                </Typography>
              </Box>
              <Chip 
                label={`${bodyList.length} ${bodyList.length === 1 ? 'file' : 'files'}`} 
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
            
            <Box sx={{ p: 2, height: '100%' }}>
              {Array.isArray(bodyList) && bodyList.length > 0 ? (
                bodyList.map((fid, idx) => renderFileItem(fid, idx, bodyList, setBodyList))
              ) : (
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
                    No body files added
                  </Typography>
                </Box>
              )}
              
              <FormControl 
                fullWidth 
                size="small" 
                sx={{ 
                  mt: bodyList.length > 0 ? 2 : 3,
                }}
              >
                <Select
                  displayEmpty
                  value=""
                  renderValue={() => (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      color: 'rgba(255, 255, 255, 0.9)',
                      gap: 0.5
                    }}>
                      <AddIcon fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Add body code file
                      </Typography>
                    </Box>
                  )}
                  onChange={(e) => {
                    const val = e.target.value as string;
                    if (val) setBodyList([...bodyList, val]);
                  }}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 1.5,
                    py: 0.25,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '& .MuiSelect-select': {
                      py: 0.75,
                      px: 1.5,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
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
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    MenuListProps: {
                      sx: {
                        p: 0,
                        '& .MuiMenuItem-root.Mui-disabled': {
                          opacity: 0.7,
                          color: 'rgba(255, 255, 255, 0.5)',
                          backgroundColor: '#292929'
                        }
                      }
                    }
                  }}
                >
                  <Box sx={{ position: 'sticky', top: 0, bgcolor: 'transparent', zIndex: 1, width: '100%' }}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        bgcolor: '#1a1a1a', 
                        borderRadius: 0,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        py: 1,
                        px: 2,
                      }}
                    >
                      <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18 }} />
                      <InputBase
                        placeholder="Search files..."
                        value={bodyFileSearch}
                        onChange={(e) => setBodyFileSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          ml: 1.5,
                          flex: 1,
                          fontSize: '0.875rem',
                          color: 'white',
                          '& .MuiInputBase-input': {
                            py: 0.75
                          }
                        }}
                      />
                      {bodyFileSearch && (
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setBodyFileSearch('');
                          }}
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.5)',
                            p: 0.5,
                            '&:hover': { color: 'white' }
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  
                  {getFilteredFiles(files.filter((f) => !bodyList.includes(String(f.id))), bodyFileSearch)
                    .map((f) => {
                      const langColor = getLanguageColor(f.language);
                      return (
                        <MenuItem 
                          key={f.id} 
                          value={String(f.id)}
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
                              {f.name}
                            </Typography>
                            <Chip
                              label={f.language.toUpperCase()}
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
            </Box>
          </Paper>
        </Box>
      </Box>
    </Card>
  );
} 