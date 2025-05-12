import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import jwt from "../../lib/utils/jwt";
import supabaseClient from "../../lib/utils/supabase";
import database from "../../lib/utils/database";

/*
    Sites API Route
    ---------------
    This route handles the GET request from the client to retrieve the list of sites associated with the user.
    It combines data from both Webflow API and our Supabase database.
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

    // Create a new WebflowClient with the Access Token
    const webflow = new WebflowClient({ accessToken });

    // Get the currently authenticated user info
    const authInfo = await webflow.token.introspect();
    const userId = (authInfo as any)?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Could not determine user ID" },
        { status: 500 }
      );
    }

    // Get all sites from Supabase that belong to this user
    const supabaseSites = await supabaseClient.client
      .from('Sites')
      .select('*')
      .eq('owner', userId);

    if (supabaseSites.error) {
      console.error("Error fetching sites from Supabase:", supabaseSites.error);
      // Continue execution, as we can still try to get sites from Webflow
    }

    // Get the list of sites from Webflow API for freshest data
    const webflowData = await webflow.sites.list();
    const webflowSites = webflowData?.sites || [];
    
    // Create a map of Webflow site IDs to their details
    const webflowSiteMap = new Map();
    webflowSites.forEach((site: any) => {
      webflowSiteMap.set(site.id, {
        name: site.name || site.displayName,
        shortName: site.shortName,
        previewUrl: site.previewUrl,
        lastPublished: site.lastPublished
      });
    });
    
    // Merge Supabase sites with Webflow data
    let sites = (supabaseSites.data || []).map((site: any) => {
      const webflowSiteInfo = webflowSiteMap.get(site.webflow_site_id) || {};
      return {
        ...site,
        name: webflowSiteInfo.name || site.webflow_site_id,
        shortName: webflowSiteInfo.shortName,
        previewUrl: webflowSiteInfo.previewUrl,
        lastPublished: webflowSiteInfo.lastPublished
      };
    });
    
    // Sort sites by name
    sites.sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Return the enriched list of sites to the client
    return NextResponse.json({ sites });
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error response
    console.error("Error handling authenticated request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
