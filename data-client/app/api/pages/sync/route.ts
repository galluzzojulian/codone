import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import jwt from "../../../lib/utils/jwt";
import supabaseClient from "../../../lib/utils/supabase";
import database from "../../../lib/utils/database";

/**
 * Pages Sync API Route
 * --------------------
 * This route handles the POST request to synchronize pages between Webflow and Supabase.
 * It fetches the latest pages from Webflow and updates the Supabase database accordingly.
 */

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    // Clone the request since we need to read the body twice
    const clonedRequest = request.clone() as NextRequest;

    // Verify the user is authenticated
    const accessToken = await jwt.verifyAuth(clonedRequest);

    // If the user is not authenticated, return a 401 Unauthorized response
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the site ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    // Get the site from Supabase to verify it exists
    const site = await supabaseClient.getSiteById(siteId);
    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Get the site access token from SQLite database
    let siteAccessToken: string;
    try {
      siteAccessToken = await database.getAccessTokenFromSiteId(siteId);
    } catch (error) {
      return NextResponse.json(
        { error: "Site authorization not found" },
        { status: 404 }
      );
    }

    // Create Webflow client with the site's access token
    const webflow = new WebflowClient({ accessToken: siteAccessToken });
    
    try {
      // First, try to fetch all pages directly
      await webflow.pages.list(siteId);

      // Then call our sync function that will process these pages
      const syncResult = await supabaseClient.syncPagesForSite(siteId, webflow);

      // Return the sync result to the client
      return NextResponse.json(syncResult);
    } catch (error) {
      // Provide detailed error information for easier debugging
      const errorDetail = error instanceof Error ? {
        message: error.message,
        name: error.name,
      } : String(error);
      
      return NextResponse.json(
        { error: "Failed to sync pages", details: errorDetail },
        { status: 500 }
      );
    }
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", message: errorMessage },
      { status: 500 }
    );
  }
} 