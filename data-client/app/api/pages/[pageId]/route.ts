import { NextRequest, NextResponse } from "next/server";
import supabaseClient from "../../../lib/utils/supabase";
import jwt from "../../../lib/utils/jwt";

function makeCorsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  } as Record<string, string>;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || undefined;
  return NextResponse.json({}, { headers: makeCorsHeaders(origin) });
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
  const origin = request.headers.get("origin") || undefined;
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: makeCorsHeaders(origin) }
      );
    }

    const { pageId } = params;
    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400, headers: makeCorsHeaders(origin) }
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
        { status: 500, headers: makeCorsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { page: data },
      { status: 200, headers: makeCorsHeaders(origin) }
    );
  } catch (error) {
    console.error("Error retrieving page:", error);
    return NextResponse.json(
      { error: "Failed to retrieve page" },
      { status: 500, headers: makeCorsHeaders(origin) }
    );
  }
}

// Update a page
export async function PUT(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const origin = request.headers.get("origin") || undefined;
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: makeCorsHeaders(origin) }
      );
    }

    const { pageId } = params;
    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400, headers: makeCorsHeaders(origin) }
      );
    }

    const body = await request.json();

    const updatedPage = await supabaseClient.updatePage(pageId, body);

    return NextResponse.json(
      { page: updatedPage },
      { status: 200, headers: makeCorsHeaders(origin) }
    );
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500, headers: makeCorsHeaders(origin) }
    );
  }
} 