import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for specific camera in a project
 * PUT: Update a camera
 * DELETE: Delete a camera
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; camera_id: string }> }
) {
  try {
    const { project_id, camera_id } = await params;
    const body = await request.json();
    
    const response = await fetch(getApiUrl(`projects/${project_id}/cameras/${camera_id}`), {
      method: "PUT",
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to update camera" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error updating camera:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; camera_id: string }> }
) {
  try {
    const { project_id, camera_id } = await params;
    
    const response = await fetch(getApiUrl(`projects/${project_id}/cameras/${camera_id}`), {
      method: "DELETE",
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to delete camera" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error deleting camera:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}