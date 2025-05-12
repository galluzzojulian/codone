import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteFile, FileLanguage } from "../types/types";

const base_url = import.meta.env.VITE_NEXTJS_API_URL;

interface CreateFilePayload {
  name: string;
  language: FileLanguage;
  code?: string;
}

interface UpdateFilePayload {
  fileId: string;
  fields: Partial<{ name: string; language: FileLanguage; code: string }>;
}

/**
 * Custom hook for fetching and mutating Files linked to a Webflow site.
 */
export function useFiles(siteId: string, sessionToken: string) {
  const queryClient = useQueryClient();

  // Fetch files for the site
  const filesQuery = useQuery<SiteFile[]>({
    queryKey: ["files", siteId],
    enabled: Boolean(siteId && sessionToken),
    queryFn: async () => {
      const res = await fetch(`${base_url}/api/files?siteId=${siteId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await res.json();
      return data.files as SiteFile[];
    },
  });

  // Create a new file
  const createMutation = useMutation<{ file: SiteFile }, Error, CreateFilePayload>({
    mutationFn: async (payload) => {
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
  };
} 