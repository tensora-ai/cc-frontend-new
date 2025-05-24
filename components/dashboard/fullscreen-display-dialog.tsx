"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Plot from 'react-plotly.js';

type DisplayType = "image" | "heatmap" | "density";

interface FullscreenDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  timestamp: string; // This should already be formatted by the parent component
  displayType: DisplayType;
  imageUrl?: string;
  densityData?: number[][];
  heatmapConfig?: [number, number, number, number]; // [left, top, right, bottom]
}

export function FullscreenDisplayDialog({
  isOpen,
  onClose,
  title,
  timestamp, // Already formatted timestamp from parent component
  displayType,
  imageUrl,
  densityData,
  heatmapConfig
}: FullscreenDisplayDialogProps) {
  const handleDownload = () => {
    if (imageUrl) {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${displayType}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Create density plot data if density display
  const getDensityPlotData = () => {
    if (!densityData) return null;
    
    const dataHeight = densityData.length;
    const dataWidth = densityData[0]?.length || 0;
    
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
    const yCoords = Array.from({ length: dataHeight }, (_, i) =>
      yOffset + (i * (physicalHeight / dataHeight))
    );
    
    return [{
      z: densityData,
      x: xCoords,
      y: yCoords,
      type: 'heatmap',
      colorscale: [
        [0, 'rgb(101, 227, 5)'],
        [0.5, 'rgb(250, 238, 65)'],
        [1, 'rgb(237, 61, 7)']
      ],
      zmin: 0,
      zmax: 2,
      hovertemplate: 'X: %{x:.1f}m<br>Y: %{y:.1f}m<br>Density: %{z:.2f}/m²<extra></extra>',
      showscale: true,
      colorbar: {
        title: {
          text: 'Density (people/m²)',
          font: { color: '#808080', size: 12 }
        },
        tickfont: { color: '#808080' },
        len: 0.8
      }
    }];
  };
  
  // Get density plot layout
  const getDensityPlotLayout = () => {
    return {
      title: '',
      xaxis: {
        title: 'Distance (meters)',
        tickfont: { color: '#808080' },
        titlefont: { color: '#808080' },
        showgrid: false,
        zeroline: false
      },
      yaxis: {
        title: 'Distance (meters)',
        tickfont: { color: '#808080' },
        titlefont: { color: '#808080' },
        showgrid: false,
        zeroline: false,
        scaleanchor: 'x',
        scaleratio: 1
      },
      margin: { l: 70, r: 70, t: 20, b: 70 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#808080' },
      width: 900,
      height: 700
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Captured: {timestamp}
            </span>
            {imageUrl && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {(displayType === "image" || displayType === "heatmap") && imageUrl && (
            <div className="flex items-center justify-center h-full">
              <Image
                src={imageUrl}
                alt={displayType === "image" ? "Camera view" : "Heatmap visualization"}
                width={1600}
                height={900}
                className="max-w-full max-h-[70vh] object-contain"
                unoptimized
              />
            </div>
          )}
          
          {displayType === "density" && densityData && (
            <div className="flex items-center justify-center h-full">
              <Plot
                data={getDensityPlotData() as any}
                layout={getDensityPlotLayout() as any}
                config={{ responsive: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}