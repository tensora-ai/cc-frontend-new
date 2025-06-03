import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";

/**
 * API route handler for projects
 * GET: List all projects
 * POST: Create a new project
 */
export async function GET() {
  try {
    const response = await fetch(getApiUrl("projects"), {
      method: "GET",
      headers: getApiHeaders(),
      cache: "no-store", // Don't cache to always get fresh data
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch projects" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(getApiUrl("projects"), {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to create project" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error creating project:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}