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
      getApiUrl(`projects/${project_id}/areas/${area_id}/nearest-camera-image?` +
        `camera_id=${encodeURIComponent(camera_id)}&` +
        `position_id=${encodeURIComponent(position_id)}&` +
        `timestamp=${encodeURIComponent(timestamp)}`),
      {
        method: "GET",
        headers: getApiHeaders(),
      }
    );
    
    if (!response.ok) {
      // Try to parse error as JSON, but it might fail if it's not JSON
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch camera image" },
        { status: response.status }
      );
    }
    
    // Get the image blob and pass it through directly
    const imageBlob = await response.blob();
    
    // Extract the X-Nearest-Timestamp header if present
    const nearestTimestamp = response.headers.get('X-Nearest-Timestamp');
    
    // Create a new response with the same blob and content type
    const newResponse = new NextResponse(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
    
    // Add the X-Nearest-Timestamp header if it was present in the backend response
    if (nearestTimestamp) {
      newResponse.headers.set('X-Nearest-Timestamp', nearestTimestamp);
    }
    
    return newResponse;
  } catch (error) {
    console.error("API error fetching camera image:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}