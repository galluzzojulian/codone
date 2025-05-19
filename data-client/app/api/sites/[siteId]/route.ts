import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import supabaseClient from "../../../lib/utils/supabase";
import jwt from "../../../lib/utils/jwt";
import { ScriptController } from "../../../lib/controllers/scriptControllers";
import { registerSiteCodeLoader } from "../../../lib/utils/siteCodeLoaderUtils";

/**
 * Single Site API
 * --------------
 * GET /api/sites/[siteId]  -> Retrieve a single site record
 * PUT /api/sites/[siteId]  -> Update fields on a site (e.g., head_files, body_files)
 * 
 * NOTE: The siteId parameter is actually webflow_site_id, not the internal Supabase id
 */

// Get a single site by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { siteId } = params;
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    console.log(`Getting site with webflow_site_id: ${siteId}`);

    // Use webflow_site_id instead of id
    const { data, error } = await supabaseClient.client
      .from("Sites")
      .select("*")
      .eq("webflow_site_id", siteId)
      .single();

    if (error) {
      console.error(`Error fetching site with webflow_site_id ${siteId}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { site: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving site:", error);
    return NextResponse.json(
      { error: "Failed to retrieve site" },
      { status: 500 }
    );
  }
}

// Update a site
export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { siteId } = params;
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    console.log(`Updating site with webflow_site_id: ${siteId}`);
    
    const body = await request.json();
    const { head_files, body_files } = body;

    // Update site in Supabase using webflow_site_id
    const { data: updatedSite, error } = await supabaseClient.client
      .from("Sites")
      .update(body)
      .eq("webflow_site_id", siteId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating site with webflow_site_id ${siteId}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("Site successfully stored in Supabase:", updatedSite);

    // If we have files to register scripts for
    if ((head_files && head_files.length > 0) || (body_files && body_files.length > 0)) {
      try {
        // Initialize Webflow client and script controller
        const webflow = new WebflowClient({ accessToken });
        const scriptController = new ScriptController(webflow);

        console.log("Registering loader scripts with Webflow...");
        
        // Use the Supabase row ID exactly as returned (can be numeric or UUID)
        const supabaseSiteId = updatedSite.id;

        console.log(`Using Supabase site ID: ${supabaseSiteId} for code loader generation`);
        console.log(`Supabase site ID details:`, {
          id: supabaseSiteId,
          type: typeof supabaseSiteId,
          constructor: supabaseSiteId?.constructor?.name,
          updatedSite: JSON.stringify(updatedSite)
        });
        
        // Extra verification that we're not using webflowSiteId by accident
        if (String(supabaseSiteId) === siteId) {
          console.error(`ERROR: Supabase site ID matches Webflow site ID! This should never happen.`);
          console.error(`This means we're using the webflowSiteId incorrectly. Using numeric ID instead.`);
        }

        // Register loader scripts with the Supabase ID
        const loaderResults = await registerSiteCodeLoader({
          scriptController,
          siteId: supabaseSiteId,        // Pass the correct internal Site ID to the loader
          webflowSiteId: siteId,         // Still use webflow_site_id for Webflow API calls
          headFiles: head_files || [],
          bodyFiles: body_files || [],
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        });

        console.log("Loader scripts registered successfully:", loaderResults);

        return NextResponse.json(
          { 
            site: updatedSite,
            codeLoader: {
              registered: true,
              results: loaderResults
            }
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("Error registering site code loader:", error);
        // Still return success for the site update, just log the script registration error
        return NextResponse.json(
          { 
            site: updatedSite,
            codeLoader: {
              registered: false,
              error: error instanceof Error ? error.message : String(error)
            }
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { site: updatedSite },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
} 