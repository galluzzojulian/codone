import { NextRequest, NextResponse } from "next/server";
import jwt from "../../lib/utils/jwt";
import supabaseClient from "../../lib/utils/supabase";

/**
 * Files API Route
 * ---------------
 * This route handles GET requests to retrieve all files for a specific site
 * and POST requests to create a new file.
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to apply CORS headers
function applyCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight request
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    // Clone the request since we need to read the body twice
    const clonedRequest = request.clone() as NextRequest;

    // Verify the user is authenticated
    const accessToken = await jwt.verifyAuth(clonedRequest);

    // If the user is not authenticated, return a 401 Unauthorized response
    if (!accessToken) {
      return applyCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Get the site ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return applyCors(
        NextResponse.json({ error: "Site ID is required" }, { status: 400 })
      );
    }

    // Fetch files for the site from Supabase
    const files = await supabaseClient.getFilesBySiteId(siteId);

    // Return the list of files to the client
    return applyCors(
      NextResponse.json({ files })
    );
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response
    console.error("Error fetching files:", error);
    return applyCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Clone the request since we need to read the body twice
    const clonedRequest = request.clone() as NextRequest;

    // Verify the user is authenticated
    const accessToken = await jwt.verifyAuth(clonedRequest);

    // If the user is not authenticated, return a 401 Unauthorized response
    if (!accessToken) {
      return applyCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Parse the request body
    const body = await request.json();
    
    // Validate the required fields
    if (!body.name || !body.language || !body.webflow_site_id) {
      return applyCors(
        NextResponse.json(
          { error: "Name, language, and webflow_site_id are required" },
          { status: 400 }
        )
      );
    }

    // Validate language is one of the allowed values
    if (!['html', 'css', 'js'].includes(body.language)) {
      return applyCors(
        NextResponse.json(
          { error: "Language must be one of: html, css, js" },
          { status: 400 }
        )
      );
    }

    // Create the file in Supabase
    const file = await supabaseClient.createFile(
      body.name,
      body.language,
      body.code || "",
      body.webflow_site_id
    );

    // Return the created file
    return applyCors(
      NextResponse.json({ file })
    );
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response
    console.error("Error creating file:", error);
    return applyCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
} 