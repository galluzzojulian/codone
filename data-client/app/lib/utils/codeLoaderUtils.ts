import { ScriptController } from "../controllers/scriptControllers";
import { generateLoaderScript } from "./loaderScript";

/**
 * Attempts to register a script with Webflow, incrementing versions if duplicates are found
 */
async function registerScriptWithRetry(
  scriptController: ScriptController,
  webflowSiteId: string,
  displayName: string,
  sourceCode: string,
  maxAttempts = 5
): Promise<{success: boolean; scriptId: string | null; error: string | null}> {
  let attempt = 0;
  let baseVersion = "1.0";
  
  while (attempt < maxAttempts) {
    const version = `${baseVersion}.${attempt}`;
    try {
      const scriptResponse = await scriptController.registerInlineScript(webflowSiteId, {
        sourceCode,
        displayName,
        version
      });
      
      return { 
        success: true, 
        scriptId: scriptResponse.id || null, 
        error: null 
      };
    } catch (error: any) {
      // If this is a duplicate script version error, try the next version
      if (error?.body?.code === 'duplicate_registered_script') {
        attempt++;
        console.log(`Duplicate script version detected, trying version ${baseVersion}.${attempt}`);
      } else {
        // Any other error, return failure
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, scriptId: null, error: errorMessage };
      }
    }
  }
  
  // If we've tried max attempts and still failed
  return { 
    success: false, 
    scriptId: null, 
    error: `Failed to register script after ${maxAttempts} version attempts` 
  };
}

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
      
      const headDisplayName = `CodeHead${safePageId.substring(0, 8)}Cfw`;
      
      // Register the script with Webflow with retry logic
      const scriptResult = await registerScriptWithRetry(
        scriptController,
        webflowSiteId,
        headDisplayName,
        headScript
      );
      
      if (scriptResult.success && scriptResult.scriptId) {
        // Apply the script to the page
        await scriptController.upsertPageCustomCode(
          webflowPageId,
          scriptResult.scriptId,
          "header", // Place in head
          "1.0.0"
        );
        
        results.head = { 
          registered: true, 
          scriptId: scriptResult.scriptId, 
          error: null 
        };
      } else {
        throw new Error(scriptResult.error || "Failed to register head script");
      }
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
      
      const bodyDisplayName = `CodeBody${safePageId.substring(0, 8)}Cfw`;
      
      // Register the script with Webflow with retry logic
      const scriptResult = await registerScriptWithRetry(
        scriptController,
        webflowSiteId,
        bodyDisplayName,
        bodyScript
      );
      
      if (scriptResult.success && scriptResult.scriptId) {
        // Apply the script to the page
        await scriptController.upsertPageCustomCode(
          webflowPageId,
          scriptResult.scriptId,
          "footer", // Place in body
          "1.0.0"
        );
        
        results.body = { 
          registered: true, 
          scriptId: scriptResult.scriptId, 
          error: null 
        };
      } else {
        throw new Error(scriptResult.error || "Failed to register body script");
      }
    } catch (error: unknown) {
      console.error("Failed to register body code loader:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.body = { registered: false, scriptId: null, error: errorMessage };
    }
  }
  
  return results;
} 