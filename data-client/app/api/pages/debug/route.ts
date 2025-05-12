import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import jwt from "../../../lib/utils/jwt";
import database from "../../../lib/utils/database";

/**
 * Pages Debug API Route
 * --------------------
 * This route provides raw Webflow API responses for debugging page fetching issues.
 */
export async function GET(request: NextRequest) {
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

    // Fetch raw page data for debugging
    try {
      // Log the token for debugging (don't do this in production)
      console.log(`Using access token for site ${siteId}: ${siteAccessToken.substring(0, 10)}...`);
      
      // Direct call to Webflow pages API
      const rawPagesResponse = await webflow.pages.list(siteId);
      
      // Return the raw Webflow API response
      return NextResponse.json({
        success: true,
        siteId,
        pageCount: rawPagesResponse?.pages?.length || 0,
        rawResponse: rawPagesResponse
      });
    } catch (error) {
      console.error(`Debug API error:`, error);
      
      // Return detailed error information
      const errorDetail = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : String(error);
      
      return NextResponse.json(
        { error: "Failed to fetch pages", details: errorDetail },
        { status: 500 }
      );
    }
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 