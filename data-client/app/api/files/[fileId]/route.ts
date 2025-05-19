import { NextRequest, NextResponse } from "next/server";
import supabaseClient from "../../../lib/utils/supabase";
import jwt from "../../../lib/utils/jwt";

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({});
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
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = params;
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const { data, error } = await supabaseClient.client
      .from("Files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ file: data }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}

// Update a file
export async function PUT(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = params;
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const body = await request.json();

    const updatedFile = await supabaseClient.updateFile(fileId, body);

    return NextResponse.json({ file: updatedFile }, { status: 200 });
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
  }
}

// Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const accessToken = await jwt.verifyAuth(request.clone() as NextRequest);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = params;
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    // Assuming supabaseClient.deleteFile exists or we use the direct Supabase client
    // For example, if deleteFile is not a custom wrapper:
    const { error } = await supabaseClient.client
      .from("Files")
      .delete()
      .eq("id", fileId);

    if (error) {
      console.error("Error deleting file from Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "File deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
} 