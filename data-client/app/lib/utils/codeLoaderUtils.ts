import { ScriptController } from "../controllers/scriptControllers";
import { generateLoaderScript } from "./loaderScript";

/**
 * Register and apply code loader scripts when page files are updated
 */
export async function registerCodeLoader({
  scriptController,
  pageId,
  webflowPageId,
  webflowSiteId,
  headFiles,
  bodyFiles,
  supabaseUrl,
  supabaseKey
}: {
  scriptController: ScriptController;
  pageId: string;
  webflowPageId: string;
  webflowSiteId: string;
  headFiles: string[];
  bodyFiles: string[];
  supabaseUrl: string;
  supabaseKey: string;
}) {
  const results = {
    head: { registered: false, scriptId: null as string | null, error: null as string | null },
    body: { registered: false, scriptId: null as string | null, error: null as string | null }
  };
  
  // Create alphanumeric displayName (removing any non-alphanumeric characters)
  const safePageId = pageId.toString().replace(/[^a-zA-Z0-9]/g, '');
  
  // Register head loader if needed
  if (headFiles && headFiles.length > 0) {
    try {
      // Generate the loader script for head
      const headScript = generateLoaderScript({
        id: pageId,
        type: 'page',
        location: 'head',
        supabaseUrl,
        supabaseKey
      });
      
      // Register the script with Webflow
      const scriptResponse = await scriptController.registerInlineScript(webflowSiteId, {
        sourceCode: headScript,
        displayName: `CodeHead${safePageId.substring(0, 8)}`,
        version: "1.0.0"
      });
      
      // Apply the script to the page
      await scriptController.upsertPageCustomCode(
        webflowPageId,
        scriptResponse.id || "",
        "header", // Place in head
        "1.0.0"
      );
      
      results.head = { 
        registered: true, 
        scriptId: scriptResponse.id || null, 
        error: null 
      };
    } catch (error: unknown) {
      console.error("Failed to register head code loader:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.head = { registered: false, scriptId: null, error: errorMessage };
    }
  }
  
  // Register body loader if needed
  if (bodyFiles && bodyFiles.length > 0) {
    try {
      // Generate the loader script for body
      const bodyScript = generateLoaderScript({
        id: pageId,
        type: 'page',
        location: 'body',
        supabaseUrl,
        supabaseKey
      });
      
      // Register the script with Webflow
      const scriptResponse = await scriptController.registerInlineScript(webflowSiteId, {
        sourceCode: bodyScript,
        displayName: `CodeBody${safePageId.substring(0, 8)}`,
        version: "1.0.0"
      });
      
      // Apply the script to the page
      await scriptController.upsertPageCustomCode(
        webflowPageId,
        scriptResponse.id || "",
        "footer", // Place in body
        "1.0.0"
      );
      
      results.body = { 
        registered: true, 
        scriptId: scriptResponse.id || null, 
        error: null 
      };
    } catch (error: unknown) {
      console.error("Failed to register body code loader:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.body = { registered: false, scriptId: null, error: errorMessage };
    }
  }
  
  return results;
} 