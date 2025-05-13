import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteFile, FileLanguage } from "../types/types";
import { useState, useEffect } from "react";

const base_url = import.meta.env.VITE_NEXTJS_API_URL;

// Keep track of API errors globally to prevent infinite render loops
let apiErrorCount = 0;
const MAX_API_RETRIES = 3;

interface CreateFilePayload {
  name: string;
  language: FileLanguage;
  code?: string;
}

interface UpdateFilePayload {
  fileId: string;
  fields: Partial<{ name: string; language: FileLanguage; code: string }>;
}

interface DeleteFilePayload {
  fileId: string;
}

/**
 * Custom hook for fetching and mutating Files linked to a Webflow site.
 */
export function useFiles(siteId: string, sessionToken: string) {
  const queryClient = useQueryClient();
  const [apiDisabled, setApiDisabled] = useState(false);

  // Reset API disabled state when component remounts
  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      apiErrorCount = 0;
    };
  }, []);

  // Fetch files for the site
  const filesQuery = useQuery<SiteFile[]>({
    queryKey: ["files", siteId],
    enabled: Boolean(siteId && sessionToken && !apiDisabled),
    staleTime: Infinity, // Prevent background refetches
    retry: false, // Don't retry failed requests automatically
    queryFn: async () => {
      try {
        const res = await fetch(`${base_url}/api/files?siteId=${siteId}`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        if (!res.ok) {
          if (apiErrorCount < MAX_API_RETRIES) {
            apiErrorCount++;
          } else {
            setApiDisabled(true);
            console.error(`API calls disabled after ${MAX_API_RETRIES} failed attempts`);
          }
          throw new Error("Failed to fetch files");
        }
        
        // Reset error count on success
        apiErrorCount = 0;
        const data = await res.json();
        return data.files as SiteFile[];
      } catch (error) {
        console.error("Error fetching files:", error);
        if (apiErrorCount < MAX_API_RETRIES) {
          apiErrorCount++;
        } else {
          setApiDisabled(true);
          console.error(`API calls disabled after ${MAX_API_RETRIES} failed attempts`);
        }
        return []; // Return empty array instead of throwing to prevent error states
      }
    },
  });

  // Create a new file
  const createMutation = useMutation<{ file: SiteFile }, Error, CreateFilePayload>({
    mutationFn: async (payload) => {
      if (apiDisabled) return { file: {} as SiteFile };
      
      const res = await fetch(`${base_url}/api/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          siteId: siteId,
          ...payload,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to create file");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", siteId] });
    },
  });

  // Update a file
  const updateMutation = useMutation<{ file: SiteFile }, Error, UpdateFilePayload>({
    mutationFn: async ({ fileId, fields }) => {
      if (apiDisabled) return { file: {} as SiteFile };
      
      const res = await fetch(`${base_url}/api/files/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        throw new Error("Failed to update file");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", siteId] });
    },
  });

  // Delete a file
  const deleteMutation = useMutation<void, Error, DeleteFilePayload>({
    mutationFn: async ({ fileId }) => {
      if (apiDisabled) return;
      
      const res = await fetch(`${base_url}/api/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to delete file");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", siteId] });
    },
  });

  return {
    files: filesQuery.data || [],
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,
    error: filesQuery.error,
    refetch: filesQuery.refetch,
    createFile: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateFile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteFile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    apiDisabled,
  };
} 