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
  maxAttempts = 50
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
 * Register and apply site-wide code loader scripts
 */
export async function registerSiteCodeLoader({
  scriptController,
  siteId,
  webflowSiteId,
  headFiles,
  bodyFiles,
  supabaseUrl,
  supabaseKey
}: {
  scriptController: ScriptController;
  siteId: string | number;
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
  
  console.log(`registerSiteCodeLoader called with siteId=${siteId}, webflowSiteId=${webflowSiteId}`);
  console.log(`headFiles=${JSON.stringify(headFiles)}, bodyFiles=${JSON.stringify(bodyFiles)}`);
  
  // Create alphanumeric displayName
  const safeSiteId = siteId.toString().replace(/[^a-zA-Z0-9]/g, '');
  
  // First, clear any existing custom code so we don't keep outdated loader scripts
  try {
    await scriptController.deleteSiteCustomCode(webflowSiteId)
    console.log(`Cleared existing custom code for site ${webflowSiteId}`)
  } catch (err) {
    console.warn(`Could not clear existing custom code for site ${webflowSiteId}:`, err)
  }
  
  // Register head loader if needed
  if (headFiles && headFiles.length > 0) {
    try {
      // Important: We NEED TO USE siteId here, not webflowSiteId
      // Generate the loader script for head
      console.log("About to generate head loader script with:", {
        siteId,
        webflowSiteId,
        typeOfSiteId: typeof siteId,
        isNumeric: !isNaN(Number(siteId))
      });
      
      const headScript = generateLoaderScript({
        id: siteId, // Use Supabase siteId for the edge function to query by id
        type: 'site',
        location: 'head',
        supabaseUrl,
        supabaseKey
      });
      
      const headDisplayName = `SiteHead${safeSiteId.substring(0, 8)}`;
      console.log(`Registering head script with name ${headDisplayName}`);
      
      // Register the script with Webflow with retry logic
      const scriptResult = await registerScriptWithRetry(
        scriptController,
        webflowSiteId,
        headDisplayName,
        headScript
      );
      
      if (scriptResult.success && scriptResult.scriptId) {
        console.log(`Head script registered successfully with ID ${scriptResult.scriptId}`);
        // Apply the script to the site
        await scriptController.upsertSiteCustomCode(
          webflowSiteId,
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
      console.error("Failed to register site head code loader:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.head = { registered: false, scriptId: null, error: errorMessage };
    }
  }
  
  // Register body loader if needed
  if (bodyFiles && bodyFiles.length > 0) {
    try {
      // Important: We NEED TO USE siteId here, not webflowSiteId
      // Generate the loader script for body
      console.log("About to generate body loader script with:", {
        siteId,
        webflowSiteId,
        typeOfSiteId: typeof siteId,
        isNumeric: !isNaN(Number(siteId))
      });
      
      const bodyScript = generateLoaderScript({
        id: siteId, // Use Supabase siteId for the edge function to query by id
        type: 'site',
        location: 'body',
        supabaseUrl,
        supabaseKey
      });
      
      const bodyDisplayName = `SiteBody${safeSiteId.substring(0, 8)}`;
      console.log(`Registering body script with name ${bodyDisplayName}`);
      
      // Register the script with Webflow with retry logic
      const scriptResult = await registerScriptWithRetry(
        scriptController,
        webflowSiteId,
        bodyDisplayName,
        bodyScript
      );
      
      if (scriptResult.success && scriptResult.scriptId) {
        console.log(`Body script registered successfully with ID ${scriptResult.scriptId}`);
        // Apply the script to the site
        await scriptController.upsertSiteCustomCode(
          webflowSiteId,
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
      console.error("Failed to register site body code loader:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.body = { registered: false, scriptId: null, error: errorMessage };
    }
  }
  
  return results;
} 