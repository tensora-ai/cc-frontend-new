import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for cameras in a project
 * POST: Add a new camera to a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params;
    const body = await request.json();
    
    const response = await fetch(getApiUrl(`projects/${project_id}/cameras`), {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to add camera" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error adding camera:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}