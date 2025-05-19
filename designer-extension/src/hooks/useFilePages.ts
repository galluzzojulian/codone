import { useState } from "react";

interface PageInfo {
  id: string;
  name: string;
  webflow_page_id: string;
  location: "head" | "body";
}

/**
 * Custom hook to fetch and manage pages where a file is used
 * @param siteId The site ID
 * @param fileId The file ID
 * @param sessionToken The authentication session token
 */
export function useFilePages(siteId: string, fileId: string | null, sessionToken: string) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;

  const fetchPages = async () => {
    if (!siteId || !fileId || !sessionToken) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all pages for the site
      const response = await fetch(`${base_url}/api/pages?siteId=${siteId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch pages");
      }
      
      const data = await response.json();
      const sitePages = data.pages || [];
      
      // Filter pages that use this file
      const pagesUsingFile: PageInfo[] = [];
      
      sitePages.forEach((page: any) => {
        // Check head_files
        let headFiles = [];
        if (Array.isArray(page.head_files)) {
          headFiles = page.head_files;
        } else if (typeof page.head_files === 'string') {
          try {
            headFiles = JSON.parse(page.head_files);
          } catch (e) {
            headFiles = [];
          }
        }
        
        // Check body_files
        let bodyFiles = [];
        if (Array.isArray(page.body_files)) {
          bodyFiles = page.body_files;
        } else if (typeof page.body_files === 'string') {
          try {
            bodyFiles = JSON.parse(page.body_files);
          } catch (e) {
            bodyFiles = [];
          }
        }
        
        // Convert to strings for comparison
        const headFileStrings = headFiles.map((id: any) => String(id));
        const bodyFileStrings = bodyFiles.map((id: any) => String(id));
        
        // Check if file is used in head
        if (headFileStrings.includes(String(fileId))) {
          pagesUsingFile.push({
            id: page.id,
            name: page.name,
            webflow_page_id: page.webflow_page_id,
            location: "head"
          });
        }
        
        // Check if file is used in body
        if (bodyFileStrings.includes(String(fileId))) {
          pagesUsingFile.push({
            id: page.id,
            name: page.name,
            webflow_page_id: page.webflow_page_id,
            location: "body"
          });
        }
      });
      
      setPages(pagesUsingFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching pages for file:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeFileFromPage = async (pageId: string, location: "head" | "body") => {
    if (!pageId || !fileId || !sessionToken) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First get the current page data
      const response = await fetch(`${base_url}/api/pages/${pageId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch page data");
      }
      
      const { page } = await response.json();
      
      // Parse current files
      let files: string[] = [];
      const filesKey = location === "head" ? "head_files" : "body_files";
      
      if (Array.isArray(page[filesKey])) {
        files = page[filesKey].map((id: any) => String(id));
      } else if (typeof page[filesKey] === 'string') {
        try {
          files = JSON.parse(page[filesKey]).map((id: any) => String(id));
        } catch (e) {
          files = [];
        }
      }
      
      // Remove the file ID from the list
      const updatedFiles = files.filter((id) => id !== String(fileId));
      
      // Update the page
      const updateResponse = await fetch(`${base_url}/api/pages/${pageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          [filesKey]: updatedFiles
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error("Failed to update page");
      }
      
      // Update local state
      setPages(prev => prev.filter(p => !(p.id === pageId && p.location === location)));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error removing file from page:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    pages,
    isLoading,
    error,
    fetchPages,
    removeFileFromPage
  };
} 