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
 * Single File API
 * --------------
 * GET /api/files/[fileId]  -> Retrieve a single file record
 * PUT /api/files/[fileId]  -> Update fields on a file (e.g., code)
 */

// Get a single file by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const origin = request.headers.get("origin") || undefined;
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: makeCorsHeaders(origin) });
    }

    const { fileId } = params;
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400, headers: makeCorsHeaders(origin) });
    }

    const { data, error } = await supabaseClient.client
      .from("Files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: makeCorsHeaders(origin) });
    }

    return NextResponse.json({ file: data }, { status: 200, headers: makeCorsHeaders(origin) });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500, headers: makeCorsHeaders(origin) });
  }
}

// Update a file
export async function PUT(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const origin = request.headers.get("origin") || undefined;
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: makeCorsHeaders(origin) });
    }

    const { fileId } = params;
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400, headers: makeCorsHeaders(origin) });
    }

    const body = await request.json();

    const updatedFile = await supabaseClient.updateFile(fileId, body);

    return NextResponse.json({ file: updatedFile }, { status: 200, headers: makeCorsHeaders(origin) });
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500, headers: makeCorsHeaders(origin) });
  }
} 