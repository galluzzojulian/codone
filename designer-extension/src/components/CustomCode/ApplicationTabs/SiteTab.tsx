import { Box, Button, Typography, CircularProgress, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { green } from "@mui/material/colors";
import { useState } from "react";
import { CustomCode } from "../../../types/types";
import { useAuth } from "../../../hooks/useAuth";
import { useApplicationStatus } from "../../../hooks/useCustomCode/useApplicationStatus";

/**
 * Props for the SiteTab component
 * @property {Object} currentSite - Current Webflow site information
 * @property {CustomCode | null} selectedScript - Currently selected script to apply
 * @property {Function} onApplyCode - Callback function to apply script to site
 */
interface SiteTabProps {
  currentSite?: {
    id: string;
    name: string;
  } | null;
  selectedScript: CustomCode | null;
  onApplyCode: (
    targetType: "site",
    targetId: string,
    location: "header" | "footer",
    sessionToken: string
  ) => Promise<void>;
}

/**
 * SiteTab component handles the application of scripts at the site level.
 * It provides functionality to:
 * - View current script application status for the site
 * - Apply scripts to either the header or footer of the site
 * - Display real-time feedback on script application status
 * - Update the head_code and body_code arrays in the Sites table in Supabase
 */
export function SiteTab({
  currentSite,
  selectedScript,
  onApplyCode,
}: Omit<SiteTabProps, "applicationStatus">) {
  // Get authentication token for API calls
  const { sessionToken } = useAuth();
  // Track success/error state for Supabase update
  const [updateStatus, setUpdateStatus] = useState<{
    success: boolean;
    error: string | null;
  } | null>(null);

  // Use React Query hook to manage script application status
  // This automatically handles:
  // - Fetching the current status
  // - Caching the results
  // - Updating when dependencies change
  // - Showing loading states
  const { applicationStatus, isLoading: isStatusLoading } =
    useApplicationStatus(
      sessionToken,
      selectedScript?.id,
      currentSite?.id,
      [] // Empty array since we're checking site-level status (no page IDs needed)
    );

  // Show loading state while fetching application status
  if (!currentSite || isStatusLoading) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading site information...
        </Typography>
      </Box>
    );
  }

  /**
   * Handles applying the selected script to the site
   * The mutation in useScriptSelection will automatically:
   * - Apply the script via the API
   * - Invalidate the status cache
   * - Trigger a refetch of the status
   * 
   * Additionally, this will:
   * - Update the Supabase Sites table with the script in the appropriate location
   * - head_code for "header" location
   * - body_code for "footer" location
   */
  const handleApplyCode = async (location: "header" | "footer") => {
    if (!selectedScript || !currentSite) return;

    setUpdateStatus(null);

    try {
      // First, apply the code using the existing Webflow API integration
      await onApplyCode("site", currentSite.id, location, sessionToken);

      // Then, update the Supabase Sites table
      const base_url = import.meta.env.VITE_NEXTJS_API_URL;
      
      // We'll format the script information for storage
      const scriptInfo = {
        id: selectedScript.id,
        version: selectedScript.version,
        name: selectedScript.displayName,
        location
      };

      // Update the site record in Supabase with the new script
      const response = await fetch(`${base_url}/api/supabase-sites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          webflow_site_id: currentSite.id,
          // Update either head_code or body_code depending on location
          ...(location === "header" 
            ? { head_code: [scriptInfo] } 
            : { body_code: [scriptInfo] })
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update Supabase: ${response.statusText}`);
      }

      setUpdateStatus({
        success: true,
        error: null
      });
    } catch (error) {
      console.error("Error applying code to site:", error);
      setUpdateStatus({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  // Get the application status for this specific site
  // This includes whether the script is applied and its location (header/footer)
  const siteStatus = applicationStatus[currentSite.id];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Apply to Site: {currentSite.name}
      </Typography>

      {/* Display current application status if script is applied */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        {selectedScript && siteStatus?.isApplied && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: green[500] }} />
            <Typography variant="body2" color="text.secondary">
              Applied • Location: {siteStatus.location || "unknown"}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Show success/error message for Supabase update */}
      {updateStatus && (
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity={updateStatus.success ? "success" : "error"}
            sx={{ mb: 2 }}
          >
            {updateStatus.success 
              ? "Script successfully applied and saved to Supabase" 
              : `Error: ${updateStatus.error}`}
          </Alert>
        </Box>
      )}

      {/* Action buttons for applying script */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleApplyCode("header")}
          disabled={!selectedScript}
        >
          Apply to Header
        </Button>
        <Button
          variant="contained"
          onClick={() => handleApplyCode("footer")}
          disabled={!selectedScript}
        >
          Apply to Footer
        </Button>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          This will update both Webflow and the Supabase Sites table with the script information.
        </Typography>
      </Box>
    </Box>
  );
}
