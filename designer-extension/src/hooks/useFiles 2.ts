import { useState } from "react";
import { File, FileCreateInput } from "../types/types";

/**
 * Hook for managing file operations with Supabase
 */
export function useFiles(sessionToken: string) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  
  const baseUrl = import.meta.env.VITE_NEXTJS_API_URL;

  /**
   * Fetch all files for a specific site
   */
  const fetchFiles = async (siteId: string) => {
    if (!sessionToken || !siteId || !isApiAvailable) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/files?siteId=${siteId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        // If the API returns 404, assume the endpoint doesn't exist yet
        if (response.status === 404) {
          console.warn("Files API endpoint not found. This feature may not be fully implemented yet.");
          setIsApiAvailable(false);
          setFiles([]);
          return;
        }
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      // For network errors (API not available), prevent further requests
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn("Unable to connect to Files API. This feature may not be fully implemented yet.");
        setIsApiAvailable(false);
        setFiles([]);
      } else {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error fetching files:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new file
   */
  const createFile = async (fileData: FileCreateInput) => {
    if (!sessionToken || !isApiAvailable) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fileData),
      });
      
      if (response.status === 404) {
        console.warn("Files API endpoint not found. This feature may not be fully implemented yet.");
        setIsApiAvailable(false);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to create file: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Refresh the files list
      await fetchFiles(fileData.webflow_site_id);
      return data.file;
    } catch (err) {
      // For network errors (API not available), prevent further requests
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn("Unable to connect to Files API. This feature may not be fully implemented yet.");
        setIsApiAvailable(false);
      } else {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error creating file:", err);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing file
   */
  const updateFile = async (fileId: string, code: string, siteId: string) => {
    if (!sessionToken || !isApiAvailable) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/files/${fileId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });
      
      if (response.status === 404) {
        console.warn("Files API endpoint not found. This feature may not be fully implemented yet.");
        setIsApiAvailable(false);
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to update file: ${response.statusText}`);
      }
      
      // Refresh the files list
      await fetchFiles(siteId);
      return true;
    } catch (err) {
      // For network errors (API not available), prevent further requests
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn("Unable to connect to Files API. This feature may not be fully implemented yet.");
        setIsApiAvailable(false);
      } else {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error updating file:", err);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a file
   */
  const deleteFile = async (fileId: string, siteId: string) => {
    if (!sessionToken || !isApiAvailable) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.status === 404) {
        console.warn("Files API endpoint not found. This feature may not be fully implemented yet.");
        setIsApiAvailable(false);
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
      
      // Refresh the files list
      await fetchFiles(siteId);
      return true;
    } catch (err) {
      // For network errors (API not available), prevent further requests
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn("Unable to connect to Files API. This feature may not be fully implemented yet.");
        setIsApiAvailable(false);
      } else {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error deleting file:", err);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    files,
    isLoading,
    error,
    isApiAvailable,
    fetchFiles,
    createFile,
    updateFile,
    deleteFile
  };
} 