import { NextRequest, NextResponse } from "next/server";
import supabaseClient from "../../lib/utils/supabase";
import jwt from "../../lib/utils/jwt";

function makeCorsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  } as Record<string, string>;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || undefined;
  return NextResponse.json({}, { headers: makeCorsHeaders(origin) });
}

/**
 * Files API
 * ---------
 * GET  /api/files?siteId=<webflow_site_id>   -> List files for a site
 * POST /api/files                            -> Create a new file for a site
 */

// List files for a given site
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin") || undefined;
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: makeCorsHeaders(origin) });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400, headers: makeCorsHeaders(origin) });
    }

    const files = await supabaseClient.getFilesBySiteId(siteId);

    return NextResponse.json({ files }, { status: 200, headers: makeCorsHeaders(origin) });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500, headers: makeCorsHeaders(origin) });
  }
}

// Create a new file for a site
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") || undefined;
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: makeCorsHeaders(origin) });
    }

    const body = await request.json();
    const { siteId, name, language, code } = body;

    if (!siteId || !name || !language) {
      return NextResponse.json({ error: "siteId, name, and language are required" }, { status: 400, headers: makeCorsHeaders(origin) });
    }

    const newFile = await supabaseClient.insertFile(siteId, name, language, code || "");

    return NextResponse.json({ file: newFile }, { status: 200, headers: makeCorsHeaders(origin) });
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json({ error: "Failed to create file" }, { status: 500, headers: makeCorsHeaders(origin) });
  }
} 