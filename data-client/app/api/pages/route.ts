import { NextRequest, NextResponse } from "next/server";
import jwt from "../../lib/utils/jwt";
import supabaseClient from "../../lib/utils/supabase";

/**
 * Pages API Route
 * ---------------
 * This route handles the GET request to retrieve all pages for a specific site.
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

    // Fetch pages for the site from Supabase
    const pages = await supabaseClient.getPagesBySiteId(siteId);

    // Return the list of pages to the client
    return NextResponse.json({ pages });
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 