import { NextRequest, NextResponse } from "next/server";
import { HeatmapData } from "@/models/dashboard";

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("project");
    const areaId = searchParams.get("area");
    const time = searchParams.get("time");
    
    // Validate required parameters
    if (!projectId || !areaId || !time) {
      return NextResponse.json(
        { error: "Missing required parameters: project, area, and time" },
        { status: 400 }
      );
    }
    
    // Parse the time
    const requestTime = new Date(time);
    
    // In a production environment, this would make a request to the backend API
    // For demonstration purposes, we'll generate sample data
    
    const heatmapData = generateSampleHeatmapData(projectId, areaId, requestTime);
    
    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error("Error processing heatmap request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate sample heatmap data
function generateSampleHeatmapData(projectId: string, areaId: string, requestTime: Date): HeatmapData {
  // Create a canvas of 800x450 pixels
  const width = 800;
  const height = 450;
  
  // Generate random density points
  const numPoints = 100 + Math.floor(Math.random() * 200); // 100-300 points
  const points = [];
  
  // Create a pattern based on area ID and time
  const seed = areaId.charCodeAt(0) + requestTime.getHours();
  
  // Generate center points for clusters (2-4 clusters)
  const numClusters = 2 + (seed % 3);
  const clusters = [];
  
  for (let i = 0; i < numClusters; i++) {
    clusters.push({
      x: 100 + Math.floor((width - 200) * (i + 0.5) / numClusters),
      y: 150 + Math.floor(Math.sin(i * Math.PI / numClusters) * 100),
      strength: 0.5 + Math.random() * 0.5 // Cluster intensity
    });
  }
  
  // Generate points with higher density around clusters
  for (let i = 0; i < numPoints; i++) {
    // Pick a random cluster to be near
    const cluster = clusters[Math.floor(Math.random() * numClusters)];
    
    // Distance from cluster center (closer points are more likely)
    const distance = Math.random() < 0.7 
      ? Math.random() * 100 // 70% chance to be close
      : Math.random() * 250; // 30% chance to be further
    
    // Random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Calculate point location
    const x = Math.max(0, Math.min(width, cluster.x + Math.cos(angle) * distance));
    const y = Math.max(0, Math.min(height, cluster.y + Math.sin(angle) * distance));
    
    // Calculate density value (higher near cluster center)
    const normalizedDistance = Math.min(1, distance / 300);
    const baseValue = cluster.strength * (1 - normalizedDistance);
    const value = baseValue * 7; // Scale to 0-7 range
    
    // Add some randomness
    const finalValue = Math.max(0, Math.min(7, value + (Math.random() * 2 - 1)));
    
    points.push({
      x: Math.round(x),
      y: Math.round(y),
      value: Number(finalValue.toFixed(2))
    });
  }
  
  return {
    points,
    dimensions: {
      width,
      height
    }
  };
}