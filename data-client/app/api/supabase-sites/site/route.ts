/**
 * Direct Site Query API Route
 * --------------------------
 * This route provides an endpoint for directly querying a specific site by ID.
 * 
 * Authentication:
 * - Requires a valid JWT token in the Authorization header
 * 
 * @module api/supabase-sites/site
 */

import { NextRequest, NextResponse } from "next/server";
import supabaseClient from "../../../lib/utils/supabase";
import jwt from "../../../lib/utils/jwt";

/**
 * GET /api/supabase-sites/site
 * ---------------------------
 * Retrieves a specific site by ID from the Supabase 'Sites' table
 * 
 * Query parameters:
 * - id: The Webflow site ID to retrieve
 * 
 * Authentication:
 * - Requires a valid JWT token in the Authorization header
 * 
 * Response:
 * - 200: Successfully retrieved site
 * - 400: Bad request (missing ID parameter)
 * - 401: Unauthorized (missing or invalid token)
 * - 404: Site not found
 * - 500: Server error
 * 
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with site data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get site ID from query parameters
    const url = new URL(request.url);
    const siteId = url.searchParams.get('id');
    
    if (!siteId) {
      return NextResponse.json({ error: "Missing site ID" }, { status: 400 });
    }
    
    // Get site from Supabase
    const site = await supabaseClient.getSiteById(siteId);
    
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Site retrieved successfully", 
      data: site
    });
  } catch (error) {
    console.error("Error retrieving site from Supabase:", error);
    return NextResponse.json(
      { error: "Failed to retrieve site" },
      { status: 500 }
    );
  }
} 