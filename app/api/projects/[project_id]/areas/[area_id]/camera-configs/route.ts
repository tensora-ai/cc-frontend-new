import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for camera configurations in an area
 * POST: Add a new camera configuration to an area
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; area_id: string }> }
) {
  try {
    const { project_id, area_id } = await params;
    const body = await request.json();
    
    const response = await fetch(getApiUrl(`projects/${project_id}/areas/${area_id}/camera-configs`), {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to add camera configuration" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error adding camera configuration:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}