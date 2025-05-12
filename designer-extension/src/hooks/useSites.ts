import { useQuery } from "@tanstack/react-query";

export interface Site {
  id: string;
  name: string;
}

/**
 * Custom hook for fetching and managing sites from Webflow.
 * This hook prioritizes the current site from Webflow Designer API
 * and falls back to fetching accessible sites from the backend API.
 */
export function useSites(sessionToken: string, hasClickedFetch: boolean) {
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;

  // Query for current site from Webflow Designer
  const currentSiteQuery = useQuery({
    queryKey: ["currentSite"],
    queryFn: async () => {
      try {
        // Get the current site info from Webflow Designer API
        const siteInfo = await webflow.getSiteInfo();
        return {
          id: siteInfo.siteId,
          name: siteInfo.siteName,
        };
      } catch (error) {
        console.error("Error fetching current site:", error);
        return null;
      }
    },
  });

  // Query for all accessible sites - only if necessary
  const sitesQuery = useQuery({
    queryKey: ["sites", sessionToken],
    queryFn: async () => {
      // If we have the current site, use that instead of making an API call
      if (currentSiteQuery.data) {
        return [currentSiteQuery.data];
      }

      if (!sessionToken) {
        return [];
      }

      try {
        const response = await fetch(`${base_url}/api/sites`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch sites: ${response.statusText}`);
        }

        // Parse response and return sites
        const data = await response.json();
        return data.sites || [];
      } catch (error) {
        console.error("Error fetching all sites:", error);
        
        // If API call fails but we have current site data, return that
        if (currentSiteQuery.data) {
          return [currentSiteQuery.data];
        }
        
        return [];
      }
    },
    enabled: Boolean(
      (sessionToken && hasClickedFetch) || 
      (currentSiteQuery.isSuccess && currentSiteQuery.data)
    ),
  });

  return {
    // Current site from Webflow Designer
    currentSite: currentSiteQuery.data,
    isCurrentSiteLoading: currentSiteQuery.isLoading,

    // All accessible sites (with fallback to current site)
    sites: sitesQuery.data || (currentSiteQuery.data ? [currentSiteQuery.data] : []),
    isLoading: sitesQuery.isLoading && currentSiteQuery.isLoading,
    isError: sitesQuery.isError && currentSiteQuery.isError,
    error: sitesQuery.error || currentSiteQuery.error,
    fetchSites: sitesQuery.refetch,
  };
}
