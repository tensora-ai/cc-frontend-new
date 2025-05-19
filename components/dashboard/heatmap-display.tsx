"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { Skeleton } from "@/components/ui/skeleton";
import { HeatmapData } from "@/models/dashboard";
import { BarChart2, FileWarning } from "lucide-react";

interface HeatmapDisplayProps {
  projectId: string;
  areaId: string;
  selectedTime: Date;
}

export function HeatmapDisplay({
  projectId,
  areaId,
  selectedTime
}: HeatmapDisplayProps) {
  // Ref for the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for heatmap data and loading
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch heatmap data when parameters change
  useEffect(() => {
    async function fetchHeatmapData() {
      if (!projectId || !areaId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get the local timezone
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Convert selected time to UTC for the API request
        const utcDate = fromZonedTime(selectedTime, timeZone);
        
        // Format the date for the API in UTC
        const endDate = format(utcDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
        
        // In a real app, this would be an API call
        const response = await fetch(`/api/heatmaps?project=${projectId}&area=${areaId}&time=${endDate}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap data: ${response.statusText}`);
        }
        
        const data: HeatmapData = await response.json();
        setHeatmapData(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch heatmap data:", err);
        setError("Failed to load heatmap data. Please try again.");
        setLoading(false);
      }
    }
    
    fetchHeatmapData();
  }, [projectId, areaId, selectedTime]);
  
  // Draw heatmap on canvas when data changes
  useEffect(() => {
    if (!heatmapData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up canvas dimensions to match heatmap dimensions
    canvas.width = heatmapData.dimensions.width;
    canvas.height = heatmapData.dimensions.height;
    
    // Draw each point
    heatmapData.points.forEach((point) => {
      // Normalize value between 0 and 1 (assuming max value is 7)
      const normalizedValue = Math.min(point.value / 7, 1);
      
      // Get color based on value (using viridis-like colormap)
      const color = getHeatColor(normalizedValue);
      
      // Draw a circle at this point
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    
    // Add grid lines for reference (optional)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
  }, [heatmapData]);
  
  // Function to generate heat colors
  const getHeatColor = (value: number): string => {
    // Viridis-like colormap
    if (value < 0.2) {
      // Dark purple to indigo
      return `rgb(68, 1, 84)`;
    } else if (value < 0.4) {
      // Indigo to blue
      return `rgb(59, 82, 139)`;
    } else if (value < 0.6) {
      // Blue to green
      return `rgb(33, 144, 141)`;
    } else if (value < 0.8) {
      // Green to yellow
      return `rgb(93, 201, 99)`;
    } else {
      // Yellow to light yellow
      return `rgb(253, 231, 37)`;
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
  if (!heatmapData || heatmapData.points.length === 0) {
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
        <canvas 
          ref={canvasRef} 
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      {/* Legend for heatmap values */}
      <div className="mt-3">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Low Density</span>
          <span>High Density</span>
        </div>
        <div className="h-2 w-full rounded-full mt-1 bg-gradient-to-r from-purple-900 via-blue-500 via-green-500 to-yellow-300" />
      </div>
    </div>
  );
}