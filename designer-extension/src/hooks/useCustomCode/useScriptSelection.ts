import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customCodeApi } from "../../services/customCode";
import { CustomCode } from "../../types/types";
import { getApplicationStatusKey } from "./useApplicationStatus";

interface ScriptQueryParams {
  siteId: string;
  sessionToken: string;
}

/**
 * Hook for managing script selection and application in the custom code interface
 * Provides functionality to select, fetch, and apply scripts to sites or pages
 *
 * @returns {Object} Object containing:
 *   - selectedScript: Currently selected script
 *   - registeredScripts: Array of available scripts
 *   - isLoading: Loading state for async operations
 *   - selectScript: Function to select a script
 *   - fetchScripts: Function to fetch available scripts
 *   - applyScript: Function to apply selected script to target
 */
export function useScriptSelection() {
  const [selectedScript, setSelectedScript] = useState<CustomCode | null>(null);
  const [queryParams, setQueryParams] = useState<ScriptQueryParams | null>(
    null
  );
  const queryClient = useQueryClient();

  /**
   * Updates the currently selected script
   * @param script - The script to select
   */
  const selectScript = useCallback((script: CustomCode) => {
    setSelectedScript(script);
  }, []);

  /**
   * Query for fetching available scripts
   */
  const { data: registeredScripts = [], isLoading: isLoadingScripts } =
    useQuery({
      queryKey: ["scripts", queryParams?.siteId, queryParams?.sessionToken],
      queryFn: async () => {
        if (!queryParams) return [];
        const response = await customCodeApi.getScripts(
          queryParams.siteId,
          queryParams.sessionToken
        );
        return response.registeredScripts || [];
      },
      enabled: Boolean(queryParams), // Only fetch when we have params
    });

  /**
   * Mutation for applying scripts
   */
  const { mutateAsync: applyScript, isPending: isApplying } = useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      location,
      sessionToken,
    }: {
      targetType: "site" | "page";
      targetId: string | string[];
      location: "header" | "footer";
      sessionToken: string;
    }) => {
      if (!selectedScript?.id) return;
      console.log("[useScriptSelection.applyScript] Applying script:", { selectedScript, targetType, targetId, location });

      // For optimistic updates
      const updateKey = getApplicationStatusKey(
        selectedScript.id,
        queryParams?.siteId,
        Array.isArray(targetId) ? targetId : [targetId]
      );

      try {
        if (Array.isArray(targetId)) {
          // Apply to each page with a small delay to avoid rate limits
          for (const id of targetId) {
            console.log("[useScriptSelection.applyScript] Calling customCodeApi.applyScript for page:", { scriptId: selectedScript.id, targetType: "page", targetId: id, location, version: selectedScript.version });
            await customCodeApi.applyScript(
              {
                scriptId: selectedScript.id,
                targetType: "page",
                targetId: id,
                location,
                version: selectedScript.version,
              },
              sessionToken
            );
            // Small delay between requests
            if (targetId.length > 1) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        } else {
          console.log("[useScriptSelection.applyScript] Calling customCodeApi.applyScript for site/page:", { scriptId: selectedScript.id, targetType, targetId, location, version: selectedScript.version });
          await customCodeApi.applyScript(
            {
              scriptId: selectedScript.id,
              targetType,
              targetId,
              location,
              version: selectedScript.version,
            },
            sessionToken
          );
        }

        // Wait a moment for the changes to propagate
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force a fresh fetch of the application status
        await queryClient.refetchQueries({
          queryKey: updateKey,
          exact: true,
          type: "active",
        });
        console.log("[useScriptSelection.applyScript] Script application successful and status refetched.");
      } catch (error) {
        console.error("Error applying script:", error);
        throw error;
      }
    },
  });

  /**
   * Wrapper function to fetch scripts with required parameters
   */
  const fetchScripts = useCallback(
    async (siteId: string, sessionToken: string) => {
      setQueryParams({ siteId, sessionToken });
    },
    []
  );

  return {
    selectedScript,
    registeredScripts,
    isLoading: isLoadingScripts || isApplying,
    selectScript,
    fetchScripts,
    applyScript,
  };
}
