import { NextRequest, NextResponse } from "next/server";
import { getApiUrl, getApiHeaders } from "@/lib/api-config";
import { AggregateTimeSeriesRequest, AggregateTimeSeriesResponse } from "@/models/dashboard";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; area_id: string }> }
) {
  try {
    // Extract project_id and area_id from the params
    const { project_id, area_id } = await params;

    const body: AggregateTimeSeriesRequest = await request.json();

    console.log("Aggregating predictions for project:", project_id, "area:", area_id, "with body:", body);
    
    // Call the backend API using path parameters instead of request body parameters
    const response = await fetch(
      getApiUrl(`projects/${project_id}/areas/${area_id}/predictions/aggregate`),
      {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          end_date: body.end_date,
          lookback_hours: body.lookback_hours,
          half_moving_avg_size: body.half_moving_avg_size || 0
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to aggregate predictions" },
        { status: response.status }
      );
    }
    
    const data: AggregateTimeSeriesResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error aggregating predictions:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}