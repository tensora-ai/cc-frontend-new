import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for images
 * GET: Get an image by name
 */
export async function GET(
  request: NextRequest,
  context: { params: { image_name: string } }
) {
  try {
    const { image_name } = context.params;
    
    const response = await fetch(getApiUrl(`images/${image_name}`), {
      method: "GET",
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Image '${image_name}' not found` },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    // Get the content type from the response
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    // Get the image data as an array buffer
    const imageData = await response.arrayBuffer();
    
    // Return the image with the correct content type
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("API error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}