import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Paper,
  TextField,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { green } from "@mui/material/colors";
import { CustomCode } from "../../../types/types";
import { useAuth } from "../../../hooks/useAuth";
import { useApplicationStatus } from "../../../hooks/useCustomCode/useApplicationStatus";
import { usePages } from "../../../hooks/usePages";
import { useSites } from "../../../hooks/useSites";

/**
 * Props for the PagesTab component
 * @property {CustomCode | null} selectedScript - Currently selected script to apply
 * @property {Function} onApplyCode - Callback function to apply script to pages
 */
interface PagesTabProps {
  selectedScript: CustomCode | null;
  onApplyCode: (
    targetType: "page",
    pageIds: string[],
    location: "header" | "footer"
  ) => Promise<void>;
}

/**
 * PagesTab component handles the application of scripts to individual pages.
 * It provides functionality to:
 * - View and search through all pages in the site
 * - Select multiple pages at once
 * - Apply scripts to selected pages
 * - View real-time application status for each page
 */
export function PagesTab({ selectedScript, onApplyCode }: PagesTabProps) {
  const { sessionToken } = useAuth();
  // Track which pages are selected for script application
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  // Search term for filtering pages
  const [searchTerm, setSearchTerm] = useState("");

  // Get the current site using React Query
  // This automatically handles caching and updates
  const { sites } = useSites(sessionToken, true);
  const currentSite = sites[0]; // Using first site in the list

  // Fetch pages data using React Query
  // This automatically handles:
  // - Caching of page data
  // - Loading states
  // - Automatic updates when site changes
  const { data: pages = [], isLoading: isPagesLoading } = usePages(
    currentSite?.id
  );

  // Fetch application status for all pages using React Query
  // This tells us which pages have the script applied and where (header/footer)
  const { applicationStatus, isLoading: isStatusLoading } =
    useApplicationStatus(
      sessionToken,
      selectedScript?.id,
      currentSite?.id,
      pages.map((p) => p.id)
    );

  // Filter pages based on search term
  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Handles selecting/deselecting all visible pages
   * If all pages are currently selected, deselects them all
   * If some or no pages are selected, selects all filtered pages
   */
  const handleSelectAll = () => {
    if (selectedPages.length === filteredPages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(filteredPages.map((page) => page.id));
    }
  };

  /**
   * Handles toggling selection of a single page
   * Adds or removes the page ID from the selectedPages array
   */
  const handleTogglePage = (pageId: string) => {
    setSelectedPages((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId]
    );
  };

  /**
   * Handles applying the script to all selected pages
   * The mutation in useScriptSelection will automatically:
   * - Apply the script to each page
   * - Invalidate the status cache
   * - Trigger a refetch of the status
   */
  const handleApplyCode = async (location: "header" | "footer") => {
    if (!selectedScript || selectedPages.length === 0) return;

    try {
      await onApplyCode("page", selectedPages, location);
      // Status will automatically update via React Query's cache invalidation
    } catch (error) {
      console.error("Error applying code to pages:", error);
    }
  };

  // Show loading state while fetching pages or status
  if (isPagesLoading || isStatusLoading) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading pages...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Apply to Pages
      </Typography>

      {/* 
        Search and Bulk Selection Section
        --------------------------------
        Provides:
        1. Search input to filter pages by name
        2. Select All button that:
           - Shows "Select All" when no or some pages are selected
           - Shows "Deselect All" when all filtered pages are selected
           - Only affects currently filtered pages
      */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button size="small" onClick={handleSelectAll} sx={{ mb: 2 }}>
          {selectedPages.length === filteredPages.length
            ? "Deselect All"
            : "Select All"}
        </Button>
      </Box>

      {/* 
        Pages List Section
        -----------------
        Scrollable list of pages showing:
        1. Checkbox for selection
        2. Page name and URL
        3. Application status (if script is applied)
           - Green checkmark
           - "Applied" text
        
        The list:
        - Only shows pages matching the search term
        - Updates selection state immediately
        - Shows real-time application status
        - Handles large numbers of pages with virtualization
      */}
      <Paper
        variant="outlined"
        sx={{ mb: 2, maxHeight: 400, overflow: "auto" }}
      >
        <List dense>
          {filteredPages.map((page) => (
            <ListItem
              key={page.id}
              secondaryAction={
                selectedScript &&
                applicationStatus[page.id]?.isApplied && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: green[500], fontSize: 16 }} />
                    <Typography variant="caption" color="text.secondary">
                      Applied
                    </Typography>
                  </Box>
                )
              }
            >
              <Checkbox
                edge="start"
                checked={selectedPages.includes(page.id)}
                onChange={() => handleTogglePage(page.id)}
              />
              <ListItemText
                primary={page.name}
                secondary={page.url}
                sx={{ mr: 2 }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* 
        Action Buttons Section
        ---------------------
        Buttons to apply the script to all selected pages:
        1. Apply to Header - adds script to <head> of each page
        2. Apply to Footer - adds script to end of <body> of each page
        
        Buttons are:
        - Disabled when no script is selected or no pages are selected
        - Apply to all selected pages in a single operation
        - Automatically update status when complete
      */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleApplyCode("header")}
          disabled={!selectedScript || selectedPages.length === 0}
          sx={{
            boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset'
          }}
        >
          Apply to Header
        </Button>
        <Button
          variant="contained"
          onClick={() => handleApplyCode("footer")}
          disabled={!selectedScript || selectedPages.length === 0}
          sx={{
            boxShadow: '0px 0.5px 1px 0px rgba(0, 0, 0, 0.8),0px 0.5px 0.5px 0px rgba(255, 255, 255, 0.20) inset'
          }}
        >
          Apply to Footer
        </Button>
      </Box>
    </Box>
  );
}
