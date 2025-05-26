"use client";

import Image from "next/image";
import { X, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Plot from 'react-plotly.js';
import { formatTimestampForBlobPath, formatUtcToLocalDisplay } from "@/lib/datetime-utils";
import { useEffect, useState, useRef, useCallback } from "react";

type DisplayType = "image" | "heatmap" | "density";

interface FullscreenDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  timestamp: string;
  displayType: DisplayType;
  imageUrl?: string;
  densityData?: number[][];
  heatmapConfig?: [number, number, number, number]; // [left, top, right, bottom]
}

export function FullscreenDisplayDialog({
  isOpen,
  onClose,
  title,
  timestamp,
  displayType,
  imageUrl,
  densityData,
  heatmapConfig
}: FullscreenDisplayDialogProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const plotRef = useRef<any>(null);

  // Calculate min/max values from the actual data (same as DensityDisplay)
  const getDataRange = (data: number[][]) => {
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const value = data[i][j];
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    
    // If all values are the same, add some range for better visualization
    if (min === max) {
      if (min === 0) {
        max = 0.1;
      } else {
        const padding = Math.abs(min) * 0.1;
        min -= padding;
        max += padding;
      }
    }
    
    return { min, max };
  };

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
  }, [displayType, densityData, imageUrl, title, timestamp, plotRef]);

  // Create density plot data matching old frontend logic
  const getDensityPlotData = () => {
    if (!densityData) return null;
    
    const dataHeight = densityData.length;
    const dataWidth = densityData[0]?.length || 0;
    
    // Calculate actual min/max from data
    const { min: dataMin, max: dataMax } = getDataRange(densityData);
    
    let physicalWidth = dataWidth;
    let physicalHeight = dataHeight;
    let xOffset = 0;
    let yOffset = 0;
    
    if (heatmapConfig && heatmapConfig.length === 4) {
      const [left, top, right, bottom] = heatmapConfig;
      physicalWidth = right - left;
      physicalHeight = bottom - top;
      xOffset = left;
      yOffset = top;
    }
    
    const xCoords = Array.from({ length: dataWidth }, (_, i) =>
      xOffset + (i * (physicalWidth / dataWidth))
    );
    // Y coordinates matching old frontend logic
    const yCoords = Array.from({ length: dataHeight }, (_, i) =>
      yOffset + ((dataHeight - 1 - i) * (physicalHeight / dataHeight))
    );
    
    return [{
      z: densityData,
      x: xCoords,
      y: yCoords,
      type: 'heatmap',
      // Use viridis colorscale to match old frontend
      colorscale: 'viridis',
      zmin: 0,  // Match old frontend (zmin=0)
      zmax: 7,  // Match old frontend (zmax=7)
      hovertemplate: 'X: %{x:.1f}m<br>Y: %{y:.1f}m<br>Density: %{z:.3f}/m²<extra></extra>',
      showscale: true,
      colorbar: {
        title: {
          text: 'density in sqm', // Match old frontend label
          font: { color: '#374151', size: 16 }
        },
        tickfont: { color: '#374151', size: 14 },
        len: 0.8,
        thickness: 25,
        tickformat: '.3f'
      }
    }];
  };
  
  // Get density plot layout
  const getDensityPlotLayout = () => {
    return {
      title: {
        text: '',
        font: { size: 18, color: '#374151' }
      },
      xaxis: {
        title: {
          text: 'Distance (meters)', // Match old frontend
          font: { size: 16, color: '#374151' }
        },
        tickfont: { color: '#374151', size: 14 },
        showgrid: false, // Match old frontend
        gridcolor: 'rgba(156, 163, 175, 0.3)',
        zeroline: false
      },
      yaxis: {
        title: {
          text: 'Distance (meters)', // Match old frontend
          font: { size: 16, color: '#374151' }
        },
        tickfont: { color: '#374151', size: 14 },
        showgrid: false, // Match old frontend
        gridcolor: 'rgba(156, 163, 175, 0.3)',
        zeroline: false,
        scaleanchor: 'x',
        scaleratio: 1
      },
      margin: { l: 80, r: 100, t: 20, b: 80 },
      paper_bgcolor: 'rgba(255,255,255,1)',
      plot_bgcolor: 'rgba(249,250,251,1)',
      font: { color: '#374151', size: 14 },
      width: Math.min(maxWidth - 60, 1400),  // Use available width with some margin
      height: Math.min(maxHeight - 60, 900), // Use available height with some margin
      autosize: false
    };
  };

  // Calculate density range for footer display
  const getDensityRange = () => {
    if (!densityData) return null;
    const { min, max } = getDataRange(densityData);
    return { min, max };
  };

  // Don't render if not open
  if (!isOpen) return null;

  const densityRange = getDensityRange();

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
            {/* Only show download button for images and heatmaps */}
            {(displayType === "image" || displayType === "heatmap") && (
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
            
            {displayType === "density" && densityData && (
              <div className="w-full h-full flex items-center justify-center rounded-lg p-4">
                <Plot
                  ref={plotRef}
                  data={getDensityPlotData() as any}
                  layout={getDensityPlotLayout() as any}
                  config={{ 
                    responsive: false,
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
                  }}
                />
              </div>
            )}
            
            {/* Loading/Error States */}
            {!imageUrl && !densityData && (
              <div className="text-center bg-white rounded-lg shadow-lg p-8">
                <Maximize2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-xl">No content available to display</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Footer with density range info */}
        {(heatmapConfig || densityData) && (
          <div className="bg-gray-50 border-t px-4 py-2 text-xs text-gray-500 shrink-0">
            {heatmapConfig && (
              <span className="mr-4">
                Crop area: [{heatmapConfig.join(', ')}] meters
              </span>
            )}
            {densityData && (
              <>
                <span className="mr-4">
                  Resolution: {densityData[0]?.length || 0} × {densityData.length} points
                </span>
                {densityRange && (
                  <span>
                    Density range: {densityRange.min.toFixed(3)} - {densityRange.max.toFixed(3)} people/m²
                  </span>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
}