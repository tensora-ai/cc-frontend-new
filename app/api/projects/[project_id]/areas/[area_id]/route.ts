import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for specific area in a project
 * PUT: Update an area
 * DELETE: Delete an area
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { project_id: string; area_id: string } }
) {
  try {
    const { project_id, area_id } = params;
    const body = await request.json();
    
    const response = await fetch(getApiUrl(`projects/${project_id}/areas/${area_id}`), {
      method: "PUT",
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to update area" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error updating area:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { project_id: string; area_id: string } }
) {
  try {
    const { project_id, area_id } = params;
    
    const response = await fetch(getApiUrl(`projects/${project_id}/areas/${area_id}`), {
      method: "DELETE",
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to delete area" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error deleting area:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}