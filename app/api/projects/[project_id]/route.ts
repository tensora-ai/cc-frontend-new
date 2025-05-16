import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for specific project
 * GET: Get project by ID
 * DELETE: Delete project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { project_id: string } }
) {
  try {
    const { project_id } = params;
    
    const response = await fetch(getApiUrl(`projects/${project_id}`), {
      method: "GET",
      headers: getApiHeaders(),
      cache: "no-store", // Don't cache to always get fresh data
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch project" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { project_id: string } }
) {
  try {
    const { project_id } = params;
    
    const response = await fetch(getApiUrl(`projects/${project_id}`), {
      method: "DELETE",
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to delete project" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}