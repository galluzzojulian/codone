import { NextRequest, NextResponse } from "next/server";
import supabaseClient from "../../../lib/utils/supabase";
import jwt from "../../../lib/utils/jwt";

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

    const updatedPage = await supabaseClient.updatePage(pageId, body);

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