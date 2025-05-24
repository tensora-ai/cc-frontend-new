"use client";

import { useState, useEffect } from "react";
import { ImageOff, RefreshCw, Maximize2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FullscreenDisplayDialog } from "./fullscreen-display-dialog";
import { formatUtcToLocalDisplay } from "@/lib/datetime-utils";

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
        
        // Construct the blob path directly
        // Format: {project_id}-{camera_id}-{position}-{timestamp}_image.jpg
        const formattedTimestamp = timestamp.replace(/[-:]/g, '_').replace('T', '-').replace('Z', '');
        const blobName = `${projectId}-${cameraId}-${positionId}-${formattedTimestamp}_small.jpg`;
        
        // Use the direct blob access endpoint
        const blobUrl = `/api/blobs/images/${blobName}`;
        
        // Get the image blob
        const response = await fetch(blobUrl);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Handle missing blob gracefully
            setError(`No data available for this timestamp`);
          } else {
            // Handle other errors
            setError(`Failed to fetch data: ${response.statusText}`);
          }
          setLoading(false);
          return;
        }

        // Get image as blob
        const blob = await response.blob();
        
        // Create a local URL for the blob
        const objectUrl = URL.createObjectURL(blob);
        
        // Set the image URL
        setImageUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch image:", err);
        setError("Failed to load camera image. Please try again.");
        setLoading(false);
      }
    }
    
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
  
  // Format timestamp for display in local time using datetime utils
  const formatTimestamp = (utcIsoString: string) => {
    return formatUtcToLocalDisplay(utcIsoString, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Use 24-hour format
    });
  };
  
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
        Captured: {formatTimestamp(timestamp)}
      </div>
      
      {/* Fullscreen dialog */}
      <FullscreenDisplayDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={`Camera View: ${cameraId} (${positionId})`}
        timestamp={formatTimestamp(timestamp)}
        displayType="image"
        imageUrl={imageUrl}
      />
    </div>
  );
}