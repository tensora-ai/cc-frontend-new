"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { CameraImage } from "@/models/dashboard";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageDisplayProps {
  projectId: string;
  areaId: string;
  selectedTime: Date;
}

export function ImageDisplay({
  projectId,
  areaId,
  selectedTime
}: ImageDisplayProps) {
  // State for images and loading
  const [images, setImages] = useState<CameraImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Current image index for navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Fetch images when parameters change
  useEffect(() => {
    async function fetchImages() {
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
        const response = await fetch(`/api/images?project=${projectId}&area=${areaId}&time=${endDate}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch images: ${response.statusText}`);
        }
        
        const data: CameraImage[] = await response.json();
        setImages(data);
        setCurrentIndex(0); // Reset to first image
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch images:", err);
        setError("Failed to load images. Please try again.");
        setLoading(false);
      }
    }
    
    fetchImages();
  }, [projectId, areaId, selectedTime]);
  
  // Handle image navigation
  const goToPrevious = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };
  
  const goToNext = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (isoString: string) => {
    try {
      // Get the local timezone
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Parse the ISO string as UTC
      const utcDate = parseISO(isoString);
      
      // Format with local time zone
      return formatInTimeZone(utcDate, timeZone, "MMM d, yyyy HH:mm:ss");
    } catch (e) {
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
          <ImageOff className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <ImageOff className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No camera images available for this time</p>
        </div>
      </div>
    );
  }
  
  // Get the current image
  const currentImage = images[currentIndex];
  
  return (
    <div className="w-full">
      <div className="relative">
        {/* Image */}
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
          <img
            src={currentImage.url}
            alt={`Camera view from ${currentImage.camera_id}`}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Navigation buttons (if more than one image) */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-2 transform -translate-y-1/2 rounded-full bg-white/80 hover:bg-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-2 transform -translate-y-1/2 rounded-full bg-white/80 hover:bg-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      {/* Image info */}
      <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
        <div>
          Camera: <span className="font-medium">{currentImage.camera_id}</span> ({currentImage.position})
        </div>
        <div className="text-xs">
          {formatTimestamp(currentImage.timestamp)}
        </div>
      </div>
      
      {/* Image pagination indicator */}
      {images.length > 1 && (
        <div className="mt-2 flex justify-center">
          {images.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-1.5 rounded-full mx-1 ${
                index === currentIndex ? "bg-[var(--tensora-medium)]" : "bg-gray-300"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}