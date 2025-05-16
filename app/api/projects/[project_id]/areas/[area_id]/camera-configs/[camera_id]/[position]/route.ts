import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for specific camera configuration in an area
 * PUT: Update a camera configuration
 * DELETE: Delete a camera configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { project_id: string; area_id: string; camera_id: string; position: string } }
) {
  try {
    const { project_id, area_id, camera_id, position } = params;
    const body = await request.json();
    
    const response = await fetch(
      getApiUrl(`projects/${project_id}/areas/${area_id}/camera-configs/${camera_id}/${position}`),
      {
        method: "PUT",
        headers: getApiHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to update camera configuration" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error updating camera configuration:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { project_id: string; area_id: string; camera_id: string; position: string } }
) {
  try {
    const { project_id, area_id, camera_id, position } = params;
    
    const response = await fetch(
      getApiUrl(`projects/${project_id}/areas/${area_id}/camera-configs/${camera_id}/${position}`),
      {
        method: "DELETE",
        headers: getApiHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to delete camera configuration" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error deleting camera configuration:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}