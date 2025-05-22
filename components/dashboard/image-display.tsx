"use client";

import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ImageOff, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface ImageDisplayProps {
  projectId: string;
  areaId: string;
  cameraId: string;
  positionId: string;
  timestamp: string;  // This is a UTC ISO string
  forceLoading?: boolean; // New prop to force loading state
}

export function ImageDisplay({
  projectId,
  areaId,
  cameraId,
  positionId,
  timestamp,
  forceLoading = false
}: ImageDisplayProps) {
  // State for image URL (created from blob) and loading
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [captureTimestamp, setCaptureTimestamp] = useState<string>(timestamp);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch image when parameters change
  useEffect(() => {
    let objectUrl: string | null = null;
    
    async function fetchImageData() {
      if (!projectId || !areaId || !cameraId || !positionId || !timestamp) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Call the nearest-camera-image endpoint
        const response = await fetch(
          `/api/projects/${projectId}/areas/${areaId}/nearest-camera-image?` +
          `camera_id=${encodeURIComponent(cameraId)}&` +
          `position_id=${encodeURIComponent(positionId)}&` +
          `timestamp=${encodeURIComponent(timestamp)}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        // Get image as blob instead of JSON
        const blob = await response.blob();
        
        // Create a local URL for the blob
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        
        // Try to get timestamp from response headers, fallback to request timestamp
        const captureTime = response.headers.get('X-Capture-Timestamp') || timestamp;
        setCaptureTimestamp(captureTime);
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch image data:", err);
        setError("Failed to load camera image. Please try again.");
        setLoading(false);
      }
    }
    
    fetchImageData();
    
    // Clean up function to revoke object URL when component unmounts or dependencies change
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [projectId, areaId, cameraId, positionId, timestamp]);
  
  // Handle force loading
  useEffect(() => {
    if (forceLoading) {
      setLoading(true);
      // Reset loading state after a brief delay
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [forceLoading]);
  
  // Format timestamp for display in local time
  const formatTimestamp = (isoString: string) => {
    try {
      // Get the local timezone
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Parse the ISO string
      const date = parseISO(isoString);
      
      // Format with local time zone
      return formatInTimeZone(date, timeZone, "MMM d, yyyy HH:mm:ss");
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown time";
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500 text-sm">Loading image...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !imageUrl) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <ImageOff className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{error || "No image available"}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={`Camera view from ${cameraId} (${positionId})`}
          width={800}
          height={450}
          className="w-full h-full object-cover"
          unoptimized // Use this for blob URLs since Next.js Image optimization doesn't work with them
        />
      </div>
      
      {/* Image info */}
      <div className="mt-2 text-xs text-gray-500">
        Captured: {formatTimestamp(captureTimestamp)}
      </div>
    </div>
  );
}