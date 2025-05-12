/**
 * Supabase Sites API Routes
 * ------------------------
 * These routes provide endpoints for interacting with site data stored in Supabase.
 * Implements GET for retrieving site data and POST for updating site data.
 * 
 * Authentication:
 * - All endpoints require authentication via JWT
 * - The token is verified using the jwt.verifyAuth utility
 * 
 * Error Handling:
 * - Returns appropriate HTTP status codes for different error scenarios
 * - Logs errors for debugging purposes
 * 
 * @module api/supabase-sites
 */

import { NextRequest, NextResponse } from "next/server";
import supabaseClient from "../../lib/utils/supabase";
import jwt from "../../lib/utils/jwt";

/**
 * GET /api/supabase-sites
 * ----------------------
 * Retrieves all sites from the Supabase 'Sites' table
 * 
 * Authentication:
 * - Requires a valid JWT token in the Authorization header
 * 
 * Response:
 * - 200: Successfully retrieved sites
 * - 401: Unauthorized (missing or invalid token)
 * - 500: Server error
 * 
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with sites data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all sites from Supabase
    const sites = await supabaseClient.listAllSites();

    return NextResponse.json({ 
      success: true, 
      message: "Sites retrieved successfully", 
      data: sites 
    });
  } catch (error) {
    console.error("Error retrieving sites from Supabase:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sites" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supabase-sites
 * -----------------------
 * Updates or creates site data in the Supabase 'Sites' table
 * 
 * Authentication:
 * - Requires a valid JWT token in the Authorization header
 * 
 * Request Body:
 * - webflow_site_id: (required) The Webflow site ID to update
 * - pages: (optional) Array of pages for the site
 * - head_code: (optional) Custom code for the site head
 * - body_code: (optional) Custom code for the site body
 * - owner: (optional) User ID of the site owner
 * 
 * Response:
 * - 200: Successfully updated site data
 * - 400: Bad request (missing required fields)
 * - 401: Unauthorized (missing or invalid token)
 * - 500: Server error
 * 
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with success or error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { webflow_site_id, pages, head_code, body_code, owner } = body;

    // Validate required fields
    if (!webflow_site_id) {
      return NextResponse.json({ error: "webflow_site_id is required" }, { status: 400 });
    }

    // Check if site exists
    const existingSite = await supabaseClient.getSiteById(webflow_site_id);
    
    // If updating an existing site, use current owner if not provided
    const siteOwner = owner || (existingSite ? existingSite.owner : 'system');

    // Update or create site data
    await supabaseClient.insertSite(
      webflow_site_id,
      siteOwner,
      {
        pages: pages || (existingSite ? existingSite.pages : []),
        head_code: head_code || (existingSite ? existingSite.head_code : ''),
        body_code: body_code || (existingSite ? existingSite.body_code : '')
      }
    );

    return NextResponse.json({
      success: true,
      message: "Site data updated successfully"
    });
  } catch (error) {
    console.error("Error updating site in Supabase:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
} 