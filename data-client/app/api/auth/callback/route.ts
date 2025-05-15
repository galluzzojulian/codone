import { WebflowClient } from "webflow-api";
import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/utils/database";
import supabaseClient from "../../../lib/utils/supabase";

// Enhanced Site type definition that includes all properties we're using
interface WebflowSite {
  id: string;
  name?: string;
  shortName?: string;
  previewUrl?: string;
  lastPublished?: string;
  workspaceId?: string;
  domain?: string;
  [key: string]: any; // Allow for additional properties
}

// Page interface definition
interface WebflowPage {
  id: string;
  name: string;
  slug: string;
  [key: string]: any; // Allow for additional properties
}

/**
 * Callback API Route Handler
 * -------------------------
 * This route processes the OAuth callback from Webflow after a user authorizes the application.
 *
 * Authentication Flow:
 * 1. Receives authorization code from Webflow
 * 2. Exchanges code for access token
 * 3. Retrieves user's Webflow sites
 * 4. Stores site authorization details in:
 *    - SQLite database (legacy storage)
 *    - Supabase database (primary storage)
 * 5. Fetches and stores all pages for each site
 * 6. Handles response based on access method (popup vs direct)
 *
 * Data Storage:
 * - SQLite: Stores site ID and access token pairs for backward compatibility
 * - Supabase: Stores comprehensive site data including:
 *   - Webflow site ID (unique identifier)
 *   - Owner (user ID)
 *   - Pages (initially empty array)
 *   - Head/body code (initially empty)
 *   - All pages for the site in the Pages table
 *
 * Response Handling:
 * - Popup windows: Returns HTML to close window and notify parent
 * - Direct navigation: Redirects to the appropriate Webflow destination
 * - Error cases: Returns appropriate error responses
 *
 * @param {NextRequest} request - The incoming request object containing:
 *   - searchParams: URL parameters including the authorization 'code'
 *   - headers: Request headers to determine if accessed via popup
 *
 * @returns {Promise<NextResponse>} The appropriate response based on the request context
 *
 * @requires {WEBFLOW_CLIENT_ID} - Environment variable for OAuth client ID
 * @requires {WEBFLOW_CLIENT_SECRET} - Environment variable for OAuth client secret
 * @requires Supabase configuration - For storing site data in Supabase
 */
export async function GET(request: NextRequest) {
  // Get the authorization code from the request
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  // If no code, return a 400 error
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    // Get Access Token
    const accessToken = await WebflowClient.getAccessToken({
      clientId: process.env.WEBFLOW_CLIENT_ID!,
      clientSecret: process.env.WEBFLOW_CLIENT_SECRET!,
      code: code,
    });

    // Instantiate the Webflow Client
    const webflow = new WebflowClient({ accessToken });

    // Get Site ID to pair with the access token
    const sites = await webflow.sites.list();
    const authInfo = await webflow.token.introspect();
    
    // Extract user information from authInfo
    const userData = (authInfo as any)?.user || {};
    const userId = userData.id || 'system';
    
    // Log user information for debugging
    console.log("User:", userData);

    // Store site authorizations in parallel - both in SQLite and Supabase
    const siteList = (sites?.sites ?? []) as WebflowSite[];
    if (siteList.length > 0) {
      // First, get existing site data to preserve values during reauthorization
      const existingSitesData = new Map();
      
      try {
        // Fetch all sites that might already exist
        const existingSites = await Promise.all(
          siteList.map(site => supabaseClient.getSiteById(site.id))
        );
        
        // Create a map of existing site data keyed by site ID
        existingSites.forEach(site => {
          if (site) {
            existingSitesData.set(site.webflow_site_id, {
              head_code: site.head_code || '',
              body_code: site.body_code || '',
              pages: site.pages || []
            });
          }
        });
      } catch (error) {
        console.error("Error fetching existing site data:", error);
        // Continue even if there's an error fetching existing data
      }

      await Promise.all([
        // Store in SQLite (existing)
        ...siteList.map((site) => db.insertSiteAuthorization(site.id, accessToken)),
        
        // Store in Supabase (new schema)
        ...siteList.map((site) => {
          // Get existing site data or use defaults
          const existingSite = existingSitesData.get(site.id);
          
          return supabaseClient.insertSite(
            site.id,  // webflow_site_id 
            userId,   // owner - explicitly using the userId from auth data
            {
              // Use existing data if available, otherwise use defaults
              pages: existingSite ? existingSite.pages : [],
              head_code: existingSite ? existingSite.head_code : '',
              body_code: existingSite ? existingSite.body_code : ''
            }
          );
        })
      ]);
      
      // After storing site information, fetch and store all pages for each site
      for (const site of siteList) {
        try {
          console.log(`Syncing pages for site ${site.id}...`);
          
          // Use the common syncPagesForSite function instead of custom logic
          // This ensures consistent page naming between auth and manual sync
          const syncResult = await supabaseClient.syncPagesForSite(site.id, webflow);
          
          console.log(`Page sync result for site ${site.id}:`, syncResult);
        } catch (pageError) {
          console.error(`Error syncing pages for site ${site.id}:`, pageError);
          // Continue with other sites even if one fails
        }
      }
    }

    // Check if the authorization request came from our Webflow designer extension
    const isAppPopup = searchParams.get("state") === "webflow_designer";
    console.log("isAppPopup", isAppPopup);

    // If the request is from a popup window, return HTML to close the window
    if (isAppPopup) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Complete</title>
          </head>
          <body>
            <h1>Authorization Complete!</h1>
            <p>Sending message to parent window and closing...</p>
            <script>
              // Add debug logging
              console.log("Auth completed, sending message to opener");
              
              // Try-catch to better debug any issues
              try {
                // Check if opener exists
                if (window.opener) {
                  window.opener.postMessage('authComplete', '*');
                  console.log("Message sent successfully");
                } else {
                  console.error("No opener window found");
                }
                
                // Close after a short delay to ensure message is sent
                setTimeout(() => {
                  window.close();
                }, 500);
              } catch (error) {
                console.error("Error sending message:", error);
                document.body.innerHTML += "<p>Error: " + error.message + "</p>";
              }
            </script>
          </body>
        </html>`,
        {
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    } else {
      // If authorized to the Workspace - redirect to the Dashboard
      const workspaceIds =
        authInfo?.authorization?.authorizedTo?.workspaceIds ?? [];
      if (workspaceIds.length > 0) {
        return NextResponse.redirect(
          `https:/webflow.com/dashboard?workspace=${workspaceIds[0]}`
        );
      } else {
        // If authorized to the Site - redirect to the Designer Extension
        const firstSite = siteList[0];
        if (firstSite) {
          return NextResponse.redirect(
            `https://${firstSite.shortName}.design.webflow.com?app=${process.env.WEBFLOW_CLIENT_ID}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json(
      { error: "Failed to process authorization" },
      { status: 500 }
    );
  }
}
