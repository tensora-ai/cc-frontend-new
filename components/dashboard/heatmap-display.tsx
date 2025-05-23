"use client";

import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { BarChart2, FileWarning, RefreshCw, Maximize2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FullscreenDisplayDialog } from "./fullscreen-display-dialog";

interface HeatmapDisplayProps {
  projectId: string;
  areaId: string;
  cameraId: string;
  positionId: string;
  timestamp: string;  // This is a UTC ISO string
  forceLoading?: boolean; // New prop to force loading state
}

export function HeatmapDisplay({
  projectId,
  areaId,
  cameraId,
  positionId,
  timestamp,
  forceLoading = false
}: HeatmapDisplayProps) {
  // State for heatmap image URL (created from blob) and loading
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [captureTimestamp, setCaptureTimestamp] = useState<string>(timestamp);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for fullscreen dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
        
        // Try to get timestamp from X-Nearest-Timestamp header, fallback to request timestamp
        const nearestTimestamp = response.headers.get('X-Nearest-Timestamp') || timestamp;
        setCaptureTimestamp(nearestTimestamp);
        
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
  
  const handleOpenDialog = () => {
    if (heatmapUrl) {
      setIsDialogOpen(true);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500 text-sm">Loading heatmap...</p>
        </div>
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
      <div 
        className="w-full aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center relative group cursor-pointer"
        onClick={handleOpenDialog}
      >
        <Image
          src={heatmapUrl}
          alt="Heat map visualization"
          width={800}
          height={450}
          className="max-w-full max-h-full object-contain"
          unoptimized // Use this for blob URLs since Next.js Image optimization doesn't work with them
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button variant="secondary" size="sm" className="bg-white/80">
            <Maximize2 className="h-4 w-4 mr-1" /> Enlarge
          </Button>
        </div>
      </div>
      
      {/* Timestamp */}
      <div className="mt-2 text-xs text-gray-500">
        Captured: {formatTimestamp(captureTimestamp)}
      </div>
      
      {/* Fullscreen dialog */}
      <FullscreenDisplayDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={`Heatmap: ${cameraId} (${positionId})`}
        timestamp={formatTimestamp(captureTimestamp)}
        displayType="heatmap"
        imageUrl={heatmapUrl}
      />
    </div>
  );
}