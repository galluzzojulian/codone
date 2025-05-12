import { useQuery } from "@tanstack/react-query";

interface PageData {
  id: string;
  name: string;
  url: string;
}

/**
 * Custom hook for fetching pages from Webflow
 * Uses React Query for efficient caching and state management
 */
export function usePages(siteId: string | undefined) {
  return useQuery({
    queryKey: ["pages", siteId],
    queryFn: async (): Promise<PageData[]> => {
      if (!siteId) return [];

      const pagesData = await webflow.getAllPagesAndFolders();
      console.log("Web flow pages raw:", pagesData);
      return Promise.all(
        pagesData.map(async (page) => ({
          id: page.id,
          name: await page.getName(),
          url: (await page.getSlug()) || "",
        }))
      );
    },
    enabled: Boolean(siteId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}
