import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; area_id: string }> }
) {
  try {
    const { project_id, area_id } = await params;
    
    // Get the query parameters
    const url = new URL(request.url);
    const camera_id = url.searchParams.get("camera_id");
    const position_id = url.searchParams.get("position_id");
    const timestamp = url.searchParams.get("timestamp");
    
    if (!camera_id || !position_id || !timestamp) {
      return NextResponse.json(
        { error: "Missing required query parameters" },
        { status: 400 }
      );
    }
    
    // Call the backend API
    const response = await fetch(
      getApiUrl(`projects/${project_id}/areas/${area_id}/nearest-density?` +
        `camera_id=${encodeURIComponent(camera_id)}&` +
        `position_id=${encodeURIComponent(position_id)}&` +
        `timestamp=${encodeURIComponent(timestamp)}`),
      {
        method: "GET",
        headers: getApiHeaders(),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch density data" },
        { status: response.status }
      );
    }

    const densityData = await response.json();
    const nearestTimestamp = response.headers.get("X-Nearest-Timestamp");

    const densityResponse = {
      data: densityData,
      timestamp: nearestTimestamp,
    }

    return NextResponse.json(densityResponse);;
  } catch (error) {
    console.error("API error fetching density data:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}