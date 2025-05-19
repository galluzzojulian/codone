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
 * OPTIONS /api/supabase-sites
 * --------------------------
 * Handles CORS preflight requests.
 *
 * Response:
 * - 200: Successfully processed OPTIONS request
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
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
 * - head_files: (optional) Custom code for the site head
 * - body_files: (optional) Custom code for the site body
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
    console.log("Received POST body:", JSON.stringify(body, null, 2));
    
    const { webflow_site_id, pages, head_files, body_files, owner } = body;

    // Validate required fields
    if (!webflow_site_id) {
      return NextResponse.json({ error: "webflow_site_id is required" }, { status: 400 });
    }

    // Check if site exists
    const existingSite = await supabaseClient.getSiteById(webflow_site_id);
    console.log("Existing site:", existingSite ? JSON.stringify({
      webflow_site_id: existingSite.webflow_site_id,
      head_files: existingSite.head_files,
      body_files: existingSite.body_files
    }, null, 2) : "No existing site");
    
    // If updating an existing site, use current owner if not provided
    const siteOwner = owner || (existingSite ? existingSite.owner : 'system');

    // Prepare data for insert
    const siteData = {
      pages: pages || (existingSite ? existingSite.pages : []),
      head_files: head_files || (existingSite ? existingSite.head_files : ''),
      body_files: body_files || (existingSite ? existingSite.body_files : '')
    };
    
    console.log("Data being sent to insertSite:", JSON.stringify({
      webflow_site_id,
      siteOwner,
      siteData
    }, null, 2));

    // Update or create site data
    try {
      const result = await supabaseClient.insertSite(
        webflow_site_id,
        siteOwner,
        siteData
      );
      console.log("Insert result:", result);
    } catch (insertError) {
      console.error("Error inserting site into Supabase:", insertError);
      return NextResponse.json({ error: "Failed to insert site" }, { status: 500 });
    }

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