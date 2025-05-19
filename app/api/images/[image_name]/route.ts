import { NextRequest, NextResponse } from "next/server";
import { CameraImage } from "@/models/dashboard";

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
    
    const sampleImages = generateSampleImages(projectId, areaId, requestTime);
    
    return NextResponse.json(sampleImages);
  } catch (error) {
    console.error("Error processing images request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate sample images
function generateSampleImages(projectId: string, areaId: string, requestTime: Date): CameraImage[] {
  // Generate 1-3 sample images
  const numImages = Math.ceil(Math.random() * 3);
  const images: CameraImage[] = [];
  
  // Camera IDs based on area
  const cameraPrefixes = {
    'faster': 'faster_',
    'harder': 'harder_',
    'louder': 'louder_',
    'main_stage': 'main_stage_',
    'dance_tent': 'dance_tent',
    'entrance': 'entrance'
  };
  
  // Camera positions
  const positions = ['left', 'right', 'center', 'standard'];
  
  // Get camera prefix for this area
  const prefix = (cameraPrefixes as any)[areaId] || 'camera_';
  
  // Create sample images
  for (let i = 0; i < numImages; i++) {
    const position = positions[i % positions.length]; 
    const cameraId = `${prefix}${position}`;
    
    // Create timestamp slightly before request time
    const timestamp = new Date(requestTime);
    timestamp.setSeconds(timestamp.getSeconds() - (i * 30)); // 30 seconds apart
    
    // Create random image URL - in a real app this would come from your backend
    // Using placeholder images from picsum.photos for demo purposes
    const imageId = 1000 + (areaId.charCodeAt(0) + i) % 100;
    
    images.push({
      url: `https://picsum.photos/id/${imageId}/800/450`,
      timestamp: timestamp.toISOString(),
      camera_id: cameraId,
      position: position
    });
  }
  
  return images;
}