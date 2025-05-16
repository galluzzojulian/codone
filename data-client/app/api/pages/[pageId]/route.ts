import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import supabaseClient from "../../../lib/utils/supabase";
import jwt from "../../../lib/utils/jwt";
import { ScriptController } from "../../../lib/controllers/scriptControllers";
import { registerCodeLoader } from "../../../lib/utils/codeLoaderUtils";

// Let's use empty headers since CORS is now handled in next.config.mjs
function getResponseHeaders() {
  return {};
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({});
}

/**
 * Single Page API
 * --------------
 * GET /api/pages/[pageId]  -> Retrieve a single page record
 * PUT /api/pages/[pageId]  -> Update fields on a page (e.g., head_files, body_files)
 */

// Get a single page by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { pageId } = params;
    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseClient.client
      .from("Pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { page: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving page:", error);
    return NextResponse.json(
      { error: "Failed to retrieve page" },
      { status: 500 }
    );
  }
}

// Update a page
export async function PUT(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { pageId } = params;
    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { head_files, body_files } = body;

    // Update page in Supabase
    const updatedPage = await supabaseClient.updatePage(pageId, body);

    // If we have files to register scripts for
    if ((head_files && head_files.length > 0) || (body_files && body_files.length > 0)) {
      try {
        // Get page details including Webflow IDs
        const { data: page } = await supabaseClient.client
          .from("Pages")
          .select("webflow_page_id, webflow_site_id")
          .eq("id", pageId)
          .single();

        if (page) {
          // Initialize Webflow client and script controller
          const webflow = new WebflowClient({ accessToken });
          const scriptController = new ScriptController(webflow);

          // Register loader scripts
          const loaderResults = await registerCodeLoader({
            scriptController,
            pageId,
            webflowPageId: page.webflow_page_id,
            webflowSiteId: page.webflow_site_id,
            headFiles: head_files || [],
            bodyFiles: body_files || [],
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
          });

          return NextResponse.json(
            { 
              page: updatedPage,
              codeLoader: {
                registered: true,
                results: loaderResults
              }
            },
            { status: 200 }
          );
        }
      } catch (error) {
        console.error("Error registering code loader:", error);
        // Still return success for the page update, just log the script registration error
        return NextResponse.json(
          { 
            page: updatedPage,
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
      { page: updatedPage },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
} 