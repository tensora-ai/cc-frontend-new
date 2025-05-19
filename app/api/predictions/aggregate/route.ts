import { NextRequest, NextResponse } from "next/server";
import { AggregateTimeSeriesRequest, AggregateTimeSeriesResponse } from "@/models/dashboard";

export async function POST(req: NextRequest) {
  try {
    const body: AggregateTimeSeriesRequest = await req.json();
    
    // Validate request
    if (!body.project || !body.area || !body.end_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Set default values if not provided
    const lookbackHours = body.lookback_hours || 3.0;
    const halfMovingAvgSize = body.half_moving_avg_size || 0;
    
    // In a production environment, this would make a request to the backend API
    // For demonstration purposes, we'll generate sample data
    
    // Parse the end date
    const endDate = new Date(body.end_date);
    
    // Generate sample time series data
    const timeSeriesData = generateSampleTimeSeriesData(
      endDate,
      lookbackHours
    );
    
    // Apply moving average smoothing if specified
    const smoothedData = halfMovingAvgSize > 0
      ? applyMovingAverageSmoothing(timeSeriesData, halfMovingAvgSize)
      : timeSeriesData;
    
    // Create response
    const response: AggregateTimeSeriesResponse = {
      time_series: smoothedData,
      source_ids: [`${body.project}-${body.area}-sample`]
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing time series request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate sample time series data
function generateSampleTimeSeriesData(endDate: Date, lookbackHours: number) {
  const timeSeriesPoints = [];
  const intervalMinutes = 5; // 5-minute intervals
  const numPoints = Math.floor(lookbackHours * 60 / intervalMinutes);
  
  // Generate points at regular intervals
  for (let i = 0; i < numPoints; i++) {
    const pointTime = new Date(endDate);
    pointTime.setMinutes(pointTime.getMinutes() - (numPoints - i - 1) * intervalMinutes);
    
    // Generate a somewhat realistic crowd count pattern
    // Base value + periodic component + random noise
    const timeOfDay = pointTime.getHours() + pointTime.getMinutes() / 60;
    const baseValue = 50;
    const timeComponent = 100 * Math.sin(Math.PI * (timeOfDay - 10) / 12) + 100; // Peak at ~4PM
    const randomNoise = Math.random() * 20 - 10; // Random noise between -10 and 10
    
    const value = Math.max(0, Math.round(baseValue + timeComponent + randomNoise));
    
    timeSeriesPoints.push({
      timestamp: pointTime.toISOString(),
      value
    });
  }
  
  return timeSeriesPoints;
}

// Helper function to apply moving average smoothing
function applyMovingAverageSmoothing(data: any[], halfWindowSize: number) {
  if (halfWindowSize <= 0 || data.length <= 1) {
    return data;
  }
  
  const windowSize = 2 * halfWindowSize + 1;
  const smoothedData = [];
  
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    
    // Sum the values in the window
    for (let j = Math.max(0, i - halfWindowSize); j <= Math.min(data.length - 1, i + halfWindowSize); j++) {
      sum += data[j].value;
      count++;
    }
    
    // Calculate the average
    const smoothedValue = Math.round(sum / count);
    
    smoothedData.push({
      timestamp: data[i].timestamp,
      value: smoothedValue
    });
  }
  
  return smoothedData;
}