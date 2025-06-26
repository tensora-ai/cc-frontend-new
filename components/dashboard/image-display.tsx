"use client";

import { useState, useEffect } from "react";
import { ImageOff, RefreshCw, Maximize2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FullscreenDisplayDialog } from "./fullscreen-display-dialog";
import { formatTimestampForBlobPath, formatUtcToLocalDisplay } from "@/lib/datetime-utils";
import { apiClient } from "@/lib/api-client";

interface ImageDisplayProps {
  projectId: string;
  cameraId: string;
  positionId: string;
  timestamp: string;  // This is a UTC ISO string
  forceLoading?: boolean; // Used to force loading state when timestamp changes
}

export function ImageDisplay({
  projectId,
  cameraId,
  positionId,
  timestamp,
  forceLoading = false
}: ImageDisplayProps) {
  console.log("🖼️ ImageDisplay render - received timestamp:", timestamp);

  // State for image URL and loading
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for fullscreen dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch image when parameters change
  useEffect(() => {
    async function fetchImageData() {
      if (!projectId || !cameraId || !positionId || !timestamp) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Construct the blob name directly
        const formattedTimestamp = formatTimestampForBlobPath(timestamp);
        const blobName = `${projectId}-${cameraId}-${positionId}-${formattedTimestamp}.jpg`;

        console.log("🔄 Fetching image blob:", blobName);
        
        // ✅ Use apiClient for direct backend access with authentication
        const blob = await apiClient.fetchImageBlob(blobName);
        
        // Create a local URL for the blob
        const objectUrl = URL.createObjectURL(blob);
        
        // Set the image URL
        setImageUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch image:", err);
        if (err instanceof Error) {
          if (err.message.includes('not found')) {
            setError("No data available for this timestamp");
          } else {
            setError(err.message);
          }
        } else {
          setError("Failed to load camera image. Please try again.");
        }
        setLoading(false);
      }
    }
    
    console.log("🔄 useEffect triggered with timestamp:", timestamp);
    fetchImageData();
  }, [projectId, cameraId, positionId, timestamp]);
  
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

  
  const handleOpenDialog = () => {
    if (imageUrl) {
      setIsDialogOpen(true);
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
      <div 
        className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100 relative group cursor-pointer"
        onClick={handleOpenDialog}
      >
        <Image
          src={imageUrl}
          alt={`Camera view from ${cameraId} (${positionId})`}
          width={800}
          height={450}
          className="w-full h-full object-cover"
          unoptimized // Use this for blob URLs since Next.js Image optimization doesn't work with them
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button variant="secondary" size="sm" className="bg-white/80">
            <Maximize2 className="h-4 w-4 mr-1" /> Enlarge
          </Button>
        </div>
      </div>
      
      {/* Image info */}
      <div className="mt-2 text-xs text-gray-500">
        Captured: {formatUtcToLocalDisplay(timestamp)}
      </div>
      
      {/* Fullscreen dialog */}
      <FullscreenDisplayDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={`Camera View: ${cameraId} (${positionId})`}
        timestamp={timestamp}
        displayType="image"
        imageUrl={imageUrl}
      />
    </div>
  );
}