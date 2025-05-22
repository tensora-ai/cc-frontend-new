"use client";

import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, FileWarning } from "lucide-react";
import Image from "next/image";

interface HeatmapDisplayProps {
  projectId: string;
  areaId: string;
  cameraId: string;
  positionId: string;
  timestamp: string;  // This is a UTC ISO string
}

export function HeatmapDisplay({
  projectId,
  areaId,
  cameraId,
  positionId,
  timestamp
}: HeatmapDisplayProps) {
  // State for heatmap image URL (created from blob) and loading
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [captureTimestamp, setCaptureTimestamp] = useState<string>(timestamp);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch heatmap when parameters change
  useEffect(() => {
    let objectUrl: string | null = null;
    
    async function fetchHeatmap() {
      if (!projectId || !areaId || !cameraId || !positionId || !timestamp) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Call the nearest-heatmap endpoint
        const response = await fetch(
          `/api/projects/${projectId}/areas/${areaId}/nearest-heatmap?` +
          `camera_id=${encodeURIComponent(cameraId)}&` +
          `position_id=${encodeURIComponent(positionId)}&` +
          `timestamp=${encodeURIComponent(timestamp)}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap: ${response.statusText}`);
        }
        
        // Get heatmap as blob instead of JSON
        const blob = await response.blob();
        
        // Create a local URL for the blob
        objectUrl = URL.createObjectURL(blob);
        setHeatmapUrl(objectUrl);
        
        // Try to get timestamp from response headers, fallback to request timestamp
        const captureTime = response.headers.get('X-Capture-Timestamp') || timestamp;
        setCaptureTimestamp(captureTime);
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch heatmap data:", err);
        setError("Failed to load heatmap data. Please try again.");
        setLoading(false);
      }
    }
    
    fetchHeatmap();
    
    // Clean up function to revoke object URL when component unmounts or dependencies change
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [projectId, areaId, cameraId, positionId, timestamp]);
  
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
      <div className="w-full aspect-video">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <FileWarning className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!heatmapUrl) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <BarChart2 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No heatmap data available for this time</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="w-full aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        <Image
          src={heatmapUrl}
          alt="Heat map visualization"
          width={800}
          height={450}
          className="max-w-full max-h-full object-contain"
          unoptimized // Use this for blob URLs since Next.js Image optimization doesn't work with them
        />
      </div>
      
      {/* Timestamp */}
      <div className="mt-2 text-xs text-gray-500">
        Captured: {formatTimestamp(captureTimestamp)}
      </div>
      
      {/* Legend for heatmap values */}
      <div className="mt-1">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Low Density</span>
          <span>High Density</span>
        </div>
        <div className="h-2 w-full rounded-full mt-1 bg-gradient-to-r from-purple-900 via-blue-500 via-green-500 to-yellow-300" />
      </div>
    </div>
  );
}