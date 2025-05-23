import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for direct blob access
 * This provides direct access to blob storage for efficient retrieval
 * 
 * It handles both image and prediction blobs through a single endpoint:
 * Format: /api/blobs/{blob_name}
 * 
 * Examples:
 * - /api/blobs/project1-camera1-position1-2023_01_01-12_00_00_small.jpg
 * - /api/blobs/project1-camera1-position1-2023_01_01-12_00_00_heatmap.png
 * - /api/blobs/project1-camera1-position1-2023_01_01-12_00_00_density.json
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ container_name: string; blob_name: string }> }
) {
  try {
    const { container_name, blob_name } = await params;
    
    // Get the backend base URL and append the blob path
    const url = getApiUrl(`blobs/${container_name}/${blob_name}`);
    
    // Call the backend API
    const response = await fetch(url, {
      method: "GET",
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch blob: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Determine the content type based on the blob path
    let contentType = 'application/octet-stream';
    if (blob_name.endsWith('.jpg') || blob_name.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (blob_name.endsWith('.png')) {
      contentType = 'image/png';
    } else if (blob_name.endsWith('.json')) {
      contentType = 'application/json';
    }
    
    // Get the blob and pass it through directly
    const blob = await response.blob();
    
    // Create a new response with the same blob and appropriate content type
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || contentType,
        'Content-Length': response.headers.get('Content-Length') || '',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error("API error fetching blob:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}