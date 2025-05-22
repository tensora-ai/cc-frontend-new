"use client";

import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, AlertTriangle } from "lucide-react";

interface DensityDisplayProps {
  projectId: string;
  areaId: string;
  cameraId: string;
  positionId: string;
  timestamp: string;  // This is a UTC ISO string
}

interface DensityResponse {
  data: number[][];
  timestamp: string;
}

export function DensityDisplay({
  projectId,
  areaId,
  cameraId,
  positionId,
  timestamp
}: DensityDisplayProps) {
  // State for density data and loading
  const [densityData, setDensityData] = useState<DensityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch density data when parameters change
  useEffect(() => {
    async function fetchDensityData() {
      if (!projectId || !areaId || !cameraId || !positionId || !timestamp) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Call the nearest-density endpoint
        const response = await fetch(
          `/api/projects/${projectId}/areas/${areaId}/nearest-density?` +
          `camera_id=${encodeURIComponent(cameraId)}&` +
          `position_id=${encodeURIComponent(positionId)}&` +
          `timestamp=${encodeURIComponent(timestamp)}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch density data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDensityData(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch density data:", err);
        setError("Failed to load density data. Please try again.");
        setLoading(false);
      }
    }
    
    fetchDensityData();
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
      <div className="w-full aspect-video flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center p-4">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Error Loading Density Data</p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
          <p className="text-red-400 text-xs mt-2">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }
  
  // Success state (placeholder for now as specified in requirements)
  return (
    <div className="w-full aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center p-4">
        <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 font-medium">Density Data Panel</p>
        <p className="text-gray-400 text-sm mt-2">This is a placeholder for the density data visualization.</p>
        <p className="text-gray-400 text-sm mt-1">Implementation coming soon!</p>
        
        {densityData && (
          <div className="mt-3 text-xs text-gray-500">
            Data available for: {formatTimestamp(densityData.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}