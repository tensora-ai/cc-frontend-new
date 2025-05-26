"use client";

import { useState, useEffect } from "react";
import { ClipboardList, AlertTriangle, RefreshCw, Maximize2 } from "lucide-react";
import Plot from 'react-plotly.js';
import { Button } from "@/components/ui/button";
import { FullscreenDisplayDialog } from "./fullscreen-display-dialog";
import { DensityResponse } from "@/models/dashboard";
import { formatTimestampForBlobPath, formatUtcToLocalDisplay } from "@/lib/datetime-utils";

interface DensityDisplayProps {
  projectId: string;
  cameraId: string;
  positionId: string;
  timestamp: string;  // This is a UTC ISO string
  heatmapConfig?: [number, number, number, number]; // [left, top, right, bottom]
  forceLoading?: boolean;
}

export function DensityDisplay({
  projectId,
  cameraId,
  positionId,
  timestamp,
  heatmapConfig,
  forceLoading = false
}: DensityDisplayProps) {
  console.log("📊 DensityDisplay render - received timestamp:", timestamp);

  const [densityResponse, setDensityResponse] = useState<DensityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for fullscreen dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Calculate min/max values from the actual data
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

  useEffect(() => {
    async function fetchDensityData() {
      if (!projectId || !cameraId || !positionId || !timestamp) return;

      try {
        setLoading(true);
        setError(null);

        // Construct the blob path directly
        // Format: {project_id}-{camera_id}-{position}-{timestamp}_density.json
        const formattedTimestamp = formatTimestampForBlobPath(timestamp);
        const blobName = `${projectId}-${cameraId}-${positionId}-${formattedTimestamp}_density.json`;
        
        // Use the direct blob access endpoint
        const blobUrl = `/api/blobs/predictions/${blobName}`;
        
        // Fetch the density data
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

        // Get heatmap as blob
        const blob = await response.blob();
        
        // Parse the JSON response
        const text = await blob.text();
        const densityData: number[][] = JSON.parse(text);
        const densityResponse: DensityResponse = {
          data: densityData,
          timestamp: timestamp
        };
        setDensityResponse(densityResponse);
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch density data:", err);
        setError("Failed to load density data. Please try again.");
        setLoading(false);
      }
    }

    console.log("🔄 useEffect triggered with timestamp:", timestamp);
    fetchDensityData();
  }, [projectId, cameraId, positionId, timestamp]);

  useEffect(() => {
    if (forceLoading) {
      setLoading(true);
      const timeoutId = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [forceLoading]);

  const handleOpenDialog = () => {
    if (densityResponse && densityResponse.data) {
      setIsDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500 text-sm">Loading density data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center p-4">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Error Loading Density Data</p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!densityResponse || densityResponse.data.length === 0) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No Density Data Available</p>
          <p className="text-gray-400 text-sm mt-2">No density measurements found for this time period.</p>
        </div>
      </div>
    );
  }

  const data = densityResponse.data;
  const dataHeight = data.length;
  const dataWidth = data[0]?.length || 0;

  // Calculate actual min/max from data
  const { min: dataMin, max: dataMax } = getDataRange(data);

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
  // Flip Y coordinates to match image orientation (Y=0 at top)
  const yCoords = Array.from({ length: dataHeight }, (_, i) =>
    yOffset + ((dataHeight - 1 - i) * (physicalHeight / dataHeight))
  );

  // Enhanced colorscale with better visual distinction
  const plotData = [{
    z: data,
    x: xCoords,
    y: yCoords,
    type: 'heatmap',
    colorscale: [
      [0, 'rgb(5, 48, 97)'],      // Dark blue (lowest density)
      [0.2, 'rgb(33, 102, 172)'], // Medium blue
      [0.4, 'rgb(67, 147, 195)'], // Light blue
      [0.6, 'rgb(146, 197, 222)'], // Very light blue
      [0.7, 'rgb(209, 229, 240)'], // Almost white
      [0.8, 'rgb(253, 219, 199)'], // Light orange
      [0.9, 'rgb(244, 165, 130)'], // Medium orange
      [1, 'rgb(214, 96, 77)']     // Dark red (highest density)
    ],
    zmin: dataMin,
    zmax: dataMax,
    hovertemplate: 'X: %{x:.1f}m<br>Y: %{y:.1f}m<br>Density: %{z:.3f}/m²<extra></extra>',
    showscale: true,
    colorbar: {
      title: {
        text: 'Density (people/m²)',
        font: { color: '#808080', size: 12 }
      },
      tickfont: { color: '#808080' },
      len: 0.8,
      tickformat: '.3f'
    }
  }];

  const layout = {
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
    margin: { l: 60, r: 60, t: 10, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#808080' }
  };

  return (
    <div className="w-full">
      <div 
        className="w-full aspect-video bg-white rounded-lg overflow-hidden border relative group cursor-pointer"
        onClick={handleOpenDialog}
      >
        <Plot
          data={plotData as any}
          layout={layout as any}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button variant="secondary" size="sm" className="bg-white/80">
            <Maximize2 className="h-4 w-4 mr-1" /> Enlarge
          </Button>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 space-y-1">
        <div>Captured: {formatUtcToLocalDisplay(timestamp)}</div>
        <div>Dimensions: {physicalWidth}m × {physicalHeight}m</div>
        <div>Density range: {dataMin.toFixed(3)} - {dataMax.toFixed(3)} people/m²</div>
        {heatmapConfig && (
          <div>Crop area: [{heatmapConfig.join(', ')}] meters</div>
        )}
      </div>
      
      {/* Fullscreen dialog for density display */}
      <FullscreenDisplayDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={`Density: ${cameraId} (${positionId})`}
        timestamp={timestamp}
        displayType="density"
        densityData={densityResponse.data}
        heatmapConfig={heatmapConfig}
      />
    </div>
  );
}