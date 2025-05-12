/**
 * Supabase Client Utility
 * -----------------------
 * This module provides functions to interact with the Supabase database.
 * It handles authentication and CRUD operations for the Sites table.
 * 
 * @module supabase
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key for server-side operations to bypass RLS
// TODO: Move this to an environment variable for production
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdnNzYmhmYnhqZXlhaHVvcGt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njk4ODk5OSwiZXhwIjoyMDYyNTY0OTk5fQ.qSwALrK5H6B6_RZlV8ut5i5-k70KH8f8E4pegPhNoR0";

if (!supabaseUrl) {
  throw new Error('Missing environment variables for Supabase configuration');
}

/**
 * Create and configure the Supabase client with the provided URL and key.
 * The service role key is used to bypass Row Level Security (RLS) policies.
 */
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Site data interface representing the structure of site records in Supabase
 */
interface SiteData {
  pages?: any[];
  head_code?: string;
  body_code?: string;
}

/**
 * Inserts a new site into the Supabase 'Sites' table when a user authorizes it
 * 
 * This function uses an upsert operation which will:
 * - Insert a new record if the webflow_site_id doesn't exist
 * - Update the existing record if the webflow_site_id already exists
 * 
 * @param {string} webflowSiteId - The unique identifier for the Webflow site
 * @param {string} owner - The owner of the site (could be user ID or email)
 * @param {SiteData} siteData - Additional site data like pages, head_code, body_code
 * @returns {Promise<object>} - The inserted record
 * @throws {Error} If the Supabase operation fails
 */
export async function insertSite(
  webflowSiteId: string,
  owner: string = 'system',
  siteData: SiteData = {}
) {
  // Validate input parameters
  if (!webflowSiteId) {
    throw new Error('webflowSiteId is required');
  }

  // Perform upsert operation with conflict handling on webflow_site_id
  const { data, error } = await supabase
    .from('Sites')
    .upsert({
      webflow_site_id: webflowSiteId,
      owner,
      pages: siteData.pages || null,
      head_code: siteData.head_code || null,
      body_code: siteData.body_code || null
    }, {
      onConflict: 'webflow_site_id',
      ignoreDuplicates: false
    });

  // Handle errors from Supabase
  if (error) {
    console.error('Error inserting site into Supabase:', error);
    throw error;
  }

  console.log('Site successfully stored in Supabase');
  return data;
}

/**
 * Inserts or updates a page in the Supabase 'Pages' table
 * 
 * This function uses an upsert operation which will:
 * - Insert a new record if the combination of webflow_site_id and webflow_page_id doesn't exist
 * - Update the existing record if the combination already exists
 * 
 * @param {string} webflowSiteId - The unique identifier for the Webflow site
 * @param {string} webflowPageId - The unique identifier for the Webflow page
 * @param {string} name - The name of the page
 * @param {Array} headFiles - Array of file IDs for head section
 * @param {Array} bodyFiles - Array of file IDs for body section
 * @returns {Promise<object>} - The inserted record
 * @throws {Error} If the Supabase operation fails
 */
export async function insertPage(
  webflowSiteId: string,
  webflowPageId: string,
  name: string,
  headFiles: string[] = [],
  bodyFiles: string[] = []
) {
  // Validate input parameters
  if (!webflowSiteId || !webflowPageId) {
    throw new Error('webflowSiteId and webflowPageId are required');
  }

  // Perform upsert operation with conflict handling
  const { data, error } = await supabase
    .from('Pages')
    .upsert({
      webflow_site_id: webflowSiteId,
      webflow_page_id: webflowPageId,
      name,
      head_files: headFiles,
      body_files: bodyFiles
    }, {
      onConflict: 'webflow_site_id,webflow_page_id',
      ignoreDuplicates: false
    });

  // Handle errors from Supabase
  if (error) {
    console.error('Error inserting page into Supabase:', error);
    throw error;
  }

  return data;
}

/**
 * Retrieves a site by Webflow site ID from the Supabase 'Sites' table
 * 
 * @param {string} webflowSiteId - The unique identifier for the Webflow site
 * @returns {Promise<object|null>} - The site data or null if not found
 * @throws {Error} If the Supabase operation fails (except for "no rows returned")
 */
export async function getSiteById(webflowSiteId: string) {
  if (!webflowSiteId) {
    throw new Error('webflowSiteId is required');
  }

  const { data, error } = await supabase
    .from('Sites')
    .select('*')
    .eq('webflow_site_id', webflowSiteId)
    .single();

  // Handle errors, but don't throw if the site is just not found
  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
    console.error('Error retrieving site from Supabase:', error);
    throw error;
  }

  return data;
}

/**
 * Lists all sites stored in the Supabase 'Sites' table
 * 
 * @returns {Promise<Array>} - Array of site records
 * @throws {Error} If the Supabase operation fails
 */
export async function listAllSites() {
  const { data, error } = await supabase
    .from('Sites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing sites from Supabase:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all pages for a specific site
 * 
 * @param {string} webflowSiteId - The unique identifier for the Webflow site
 * @returns {Promise<Array>} - Array of page records
 * @throws {Error} If the Supabase operation fails
 */
export async function getPagesBySiteId(webflowSiteId: string) {
  if (!webflowSiteId) {
    throw new Error('webflowSiteId is required');
  }

  const { data, error } = await supabase
    .from('Pages')
    .select('*')
    .eq('webflow_site_id', webflowSiteId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error retrieving pages from Supabase:', error);
    throw error;
  }

  return data || [];
}

/**
 * Sync pages for a site by fetching current pages from Webflow and updating Supabase
 * 
 * @param {string} webflowSiteId - The unique identifier for the Webflow site
 * @param {Object} webflowClient - Initialized Webflow client with proper authentication
 * @returns {Promise<object>} - Result of the operation
 * @throws {Error} If the operation fails
 */
export async function syncPagesForSite(webflowSiteId: string, webflowClient: any) {
  // Fetch latest pages from Webflow
  const pagesResponse = await webflowClient.pages.list(webflowSiteId);
  const webflowPages = pagesResponse?.pages || [];
  
  // Get existing pages from Supabase
  const existingPages = await getPagesBySiteId(webflowSiteId);
  const existingPageIds = new Set(existingPages.map(p => p.webflow_page_id));
  
  // Track new, updated, and unchanged pages
  const newPages = [];
  const updatedPages = [];
  
  // Create a set of current Webflow page IDs
  const currentWebflowPageIds = new Set(webflowPages.map((page: any) => page.id));
  
  // Find deleted pages (pages in Supabase but not in Webflow anymore)
  const deletedPageIds = existingPages
    .filter(page => !currentWebflowPageIds.has(page.webflow_page_id))
    .map(page => page.id);
  
  // Process each Webflow page
  for (const page of webflowPages) {
    const pageName = extractPageName(page);
    
    if (!existingPageIds.has(page.id)) {
      // New page
      newPages.push({
        webflow_site_id: webflowSiteId,
        webflow_page_id: page.id,
        name: pageName,
        head_files: [],
        body_files: []
      });
    } else {
      // Existing page - update name in case it changed
      const existingPage = existingPages.find(p => p.webflow_page_id === page.id);
      if (existingPage && existingPage.name !== pageName) {
        updatedPages.push({
          ...existingPage,
          name: pageName
        });
      }
    }
  }
  
  // Insert new pages
  if (newPages.length > 0) {
    const { error } = await supabase
      .from('Pages')
      .upsert(newPages);
      
    if (error) {
      throw new Error(`Error syncing new pages: ${error.message}`);
    }
  }
  
  // Update existing pages
  if (updatedPages.length > 0) {
    const { error } = await supabase
      .from('Pages')
      .upsert(updatedPages);
      
    if (error) {
      throw new Error(`Error updating pages: ${error.message}`);
    }
  }
  
  // Delete pages that no longer exist in Webflow
  let deletedCount = 0;
  if (deletedPageIds.length > 0) {
    const { error, count } = await supabase
      .from('Pages')
      .delete()
      .in('id', deletedPageIds);
      
    if (error) {
      throw new Error(`Error deleting removed pages: ${error.message}`);
    }
    
    deletedCount = count || 0;
  }
  
  return {
    success: true,
    siteId: webflowSiteId,
    pageCount: webflowPages.length,
    added: newPages.length,
    updated: updatedPages.length,
    deleted: deletedCount,
    rawResponse: pagesResponse
  };
}

/**
 * Helper function to extract the best name from a Webflow page object
 */
function extractPageName(page: any): string {
  // Try different properties in order of preference
  if (page.displayName && typeof page.displayName === 'string' && page.displayName.trim()) {
    return page.displayName.trim();
  }
  
  if (page.name && typeof page.name === 'string' && page.name.trim()) {
    return page.name.trim();
  }
  
  if (page.title && typeof page.title === 'string' && page.title.trim()) {
    return page.title.trim();
  }
  
  if (page.slug && typeof page.slug === 'string' && page.slug.trim()) {
    return page.slug.trim().replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
  
  // Last resort - use the page ID
  return `Page ${page.id.substring(0, 8)}`;
}

/**
 * Inserts a new file record into the Supabase `Files` table.
 *
 * @param webflowSiteId - The Webflow site the file belongs to
 * @param name - Display name for the file
 * @param language - Programming language (html | css | js)
 * @param code - Initial source code (optional, defaults to empty string)
 */
export async function insertFile(
  webflowSiteId: string,
  name: string,
  language: "html" | "css" | "js",
  code: string = ""
) {
  if (!webflowSiteId || !name || !language) {
    throw new Error("webflowSiteId, name and language are required");
  }

  const { data, error } = await supabase
    .from("Files")
    .insert({
      webflow_site_id: webflowSiteId,
      name,
      language,
      code,
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting file into Supabase:", error);
    throw error;
  }

  return data;
}

/**
 * Retrieves all files for a given Webflow site.
 *
 * @param webflowSiteId - The Webflow site ID to filter by
 */
export async function getFilesBySiteId(webflowSiteId: string) {
  if (!webflowSiteId) {
    throw new Error("webflowSiteId is required");
  }

  const { data, error } = await supabase
    .from("Files")
    .select("*")
    .eq("webflow_site_id", webflowSiteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error retrieving files from Supabase:", error);
    throw error;
  }

  return data || [];
}

/**
 * Updates a file record by ID.
 *
 * @param fileId - Primary key ID of the file
 * @param fields - Partial fields to update (e.g., { code })
 */
export async function updateFile(
  fileId: string,
  fields: Partial<{ name: string; language: string; code: string }>
) {
  if (!fileId) {
    throw new Error("fileId is required");
  }

  const { data, error } = await supabase
    .from("Files")
    .update(fields)
    .eq("id", fileId)
    .select()
    .single();

  if (error) {
    console.error("Error updating file in Supabase:", error);
    throw error;
  }

  return data;
}

/**
 * Updates a page record by ID.
 *
 * @param pageId - Primary key ID of the page
 * @param fields - Partial fields to update (e.g., { head_files, body_files, name })
 */
export async function updatePage(
  pageId: string,
  fields: Partial<{ head_files: string[]; body_files: string[]; name: string }>
) {
  if (!pageId) {
    throw new Error("pageId is required");
  }

  const { data, error } = await supabase
    .from("Pages")
    .update(fields)
    .eq("id", pageId)
    .select()
    .single();

  if (error) {
    console.error("Error updating page in Supabase:", error);
    throw error;
  }

  return data;
}

/**
 * Supabase client and utility functions for site operations
 */
const supabaseClient = {
  insertSite,
  insertPage,
  getSiteById,
  listAllSites,
  getPagesBySiteId,
  syncPagesForSite,
  insertFile,
  getFilesBySiteId,
  updateFile,
  updatePage,
  client: supabase
};

export default supabaseClient; 