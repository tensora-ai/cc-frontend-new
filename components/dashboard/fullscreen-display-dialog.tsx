"use client";

import Image from "next/image";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimestampForBlobPath, formatUtcToLocalDisplay } from "@/lib/datetime-utils";
import { useEffect, useState, useCallback } from "react";

type DisplayType = "image" | "heatmap";

interface FullscreenDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  timestamp: string;
  displayType: DisplayType;
  imageUrl?: string;
}

export function FullscreenDisplayDialog({
  isOpen,
  onClose,
  title,
  timestamp,
  displayType,
  imageUrl
}: FullscreenDisplayDialogProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Track window size for responsive sizing
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Calculate maximum available space
  const getContentDimensions = () => {
    // Account for: 
    // - 32px padding on each side (64px total horizontal)
    // - 5% viewport margin on each side (10% total)
    // - Header height (~70px) and content padding (~48px)
    const availableHeight = Math.min(windowSize.height * 0.95, windowSize.height - 64) - 118;
    const availableWidth = Math.min(windowSize.width * 0.95, windowSize.width - 64) - 48;
    
    return {
      maxWidth: Math.max(availableWidth, 600), // Minimum reasonable width
      maxHeight: Math.max(availableHeight, 400) // Minimum reasonable height
    };
  };

  const { maxWidth, maxHeight } = getContentDimensions();

  // Enhanced download functionality
  const handleDownload = useCallback(async () => {
    try {
      const filenameTimestamp = formatTimestampForBlobPath(timestamp);
      const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const extension = displayType === 'image' ? 'jpg' : 'png';
          const link = document.createElement('a');
          link.href = url;
          link.download = `${displayType}_${cleanTitle}_${filenameTimestamp}.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Download failed:', error);
          const extension = displayType === 'image' ? 'jpg' : 'png';
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `${displayType}_${cleanTitle}_${filenameTimestamp}.${extension}`;
          link.target = '_blank';
          link.click();
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [displayType, imageUrl, title, timestamp]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
        <div className="w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
              {title}
            </h2>
            <p className="text-sm text-gray-500 truncate">
              Captured: {formatUtcToLocalDisplay(timestamp)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Download button for images and heatmaps */}
            {imageUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-1" /> 
                Download
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content Area - This takes up the remaining space */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            {(displayType === "image" || displayType === "heatmap") && imageUrl && (
              <div className="w-full h-full flex items-center justify-center rounded-lg p-4">
                <Image
                  src={imageUrl}
                  alt={displayType === "image" ? "Camera view" : "Heatmap visualization"}
                  width={2000}
                  height={2000}
                  className="max-w-full max-h-full object-contain rounded"
                  unoptimized
                  priority
                />
              </div>
            )}
            
            {/* Loading/Error States */}
            {!imageUrl && (
              <div className="text-center bg-white rounded-lg shadow-lg p-8">
                <X className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-xl">No content available to display</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer - only shows if we have an image */}
        {imageUrl && (
          <div className="bg-gray-50 border-t px-4 py-2 text-xs text-gray-500 shrink-0">
            <span>
              {displayType === "image" ? "Camera image" : "Heatmap visualization"} captured at {formatUtcToLocalDisplay(timestamp)}
            </span>
          </div>
        )}
        </div>
      </div>
    </>
  );
}