"use client";

import { useState, useEffect } from "react";
import { ClipboardList, AlertTriangle, RefreshCw, Maximize2 } from "lucide-react";
import Plot from 'react-plotly.js';
import { Button } from "@/components/ui/button";
import { FullscreenDisplayDialog } from "./fullscreen-display-dialog";
import { DensityResponse } from "@/models/dashboard";
import { formatTimestampForBlobPath, formatUtcToLocalDisplay } from "@/lib/datetime-utils";
import { HeatmapConfig } from "@/models/project";

interface DensityDisplayProps {
  projectId: string;
  cameraId: string;
  positionId: string;
  timestamp: string;  // This is a UTC ISO string
  heatmapConfig?: HeatmapConfig; // [left, top, right, bottom]
  forceLoading?: boolean;
}

// Coordinate point from transformed density JSON: [x, y, density_value]
type CoordinatePoint = [number, number, number];

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

  // Helper function to filter coordinates based on crop area (from old frontend)
  const filterCoords = (coords: CoordinatePoint[], crop: HeatmapConfig): CoordinatePoint[] => {
    const [left, top, right, bottom] = crop;
    return coords.filter(([x, y, val]) => 
      x >= left && x <= right && y >= top && y <= bottom
    );
  };

  // Helper function to convert coordinates to 2D array (from old frontend)
  const convertToArray = (
    items: CoordinatePoint[], 
    dateStr: string, 
    crop?: [number, number, number, number]
  ): number[][] => {
    let l: number, t: number, r: number, b: number;
    
    if (crop) {
      [l, t, r, b] = crop;
    } else {
      l = Math.min(...items.map(x => x[0]));
      t = Math.min(...items.map(x => x[1]));
      r = Math.max(...items.map(x => x[0])) + 1;
      b = Math.max(...items.map(x => x[1])) + 1;
    }

    // Date-specific meter conversion (from old frontend)
    const meterConversion = (dateStr === "2024-08-01" || dateStr === "2024-07-31") ? 2 : 1;

    // Calculate the dimensions of the array
    const width = (r - l) * meterConversion;
    const height = (b - t) * meterConversion;

    // Create an empty array filled with zeros
    const array: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

    // Fill the array with intensity values
    for (const [x, y, val] of items) {
      if (l <= x && x < r && t <= y && y < b) {
        // Convert coordinates to array indices
        const j = Math.floor((x - l) * meterConversion);
        const i = Math.floor((y - t) * meterConversion);
        
        if (0 <= i && i < height && 0 <= j && j < width) {
          // Apply the same value capping as old frontend
          const maxValue = Math.random() < 0.1 ? 
            [5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.0, 6.1, 6.2][Math.floor(Math.random() * 9)] : 
            6.0;
          array[height - i - 1][j] = Math.min(Math.round(val * 10) / 10, maxValue);
        }
      }
    }

    return array;
  };

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

        // Construct the blob path for TRANSFORMED density data
        // Format: {project_id}-{camera_id}-{position}-{timestamp}_transformed_density.json
        const formattedTimestamp = formatTimestampForBlobPath(timestamp);
        const blobName = `${projectId}-${cameraId}-${positionId}-${formattedTimestamp}_transformed_density.json`;
        
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

        // Get density data as blob
        const blob = await response.blob();
        
        // Parse the JSON response - this should be coordinate data: [[x, y, density], ...]
        const text = await blob.text();
        const coordinateData: CoordinatePoint[] = JSON.parse(text);
        
        console.log("📊 Raw coordinate data:", coordinateData.slice(0, 5)); // Log first 5 points
        
        // Apply filtering and conversion logic from old frontend
        let processedCoords = coordinateData;
        
        // Apply cropping if heatmapConfig is provided
        if (heatmapConfig) {
          processedCoords = filterCoords(coordinateData, heatmapConfig);
          console.log("📊 Filtered coordinates:", processedCoords.length, "from", coordinateData.length);
        }
        
        // Extract date from timestamp for meter conversion logic
        const dateStr = timestamp.split('T')[0];
        
        // Convert coordinates to 2D array
        const densityArray = convertToArray(processedCoords, dateStr, heatmapConfig);
        
        console.log("📊 Converted array dimensions:", densityArray.length, "x", densityArray[0]?.length);
        
        const densityResponse: DensityResponse = {
          data: densityArray,
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
  }, [projectId, cameraId, positionId, timestamp, heatmapConfig]);

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

  // Calculate physical dimensions and coordinates (matching old frontend logic)
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

  // Create coordinate arrays matching the old frontend
  const xCoords = Array.from({ length: dataWidth }, (_, i) =>
    xOffset + (i * (physicalWidth / dataWidth))
  );
  
  // Y coordinates - match the old frontend logic with origin="lower"
  const yCoords = Array.from({ length: dataHeight }, (_, i) =>
    yOffset + ((dataHeight - 1 - i) * (physicalHeight / dataHeight))
  );

  // Use viridis colorscale to match old frontend (they commented out custom scale)
  const plotData = [{
    z: data,
    x: xCoords,
    y: yCoords,
    type: 'heatmap',
    colorscale: 'viridis', // Match old frontend
    zmin: 0,  // Match old frontend (zmin=0)
    zmax: 7,  // Match old frontend (zmax=7)
    hovertemplate: 'X: %{x:.1f}m<br>Y: %{y:.1f}m<br>Density: %{z:.3f}/m²<extra></extra>',
    showscale: true,
    colorbar: {
      title: {
        text: 'people/m²',
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
      title: 'Distance (meters)', // Match old frontend
      tickfont: { color: '#808080' },
      titlefont: { color: '#808080' },
      showgrid: false,
      zeroline: false
    },
    yaxis: {
      title: 'Distance (meters)', // Match old frontend
      tickfont: { color: '#808080' },
      titlefont: { color: '#808080' },
      showgrid: false,
      zeroline: false,
      scaleanchor: 'x',
      scaleratio: 1
    },
    margin: { l: 60, r: 60, t: 10, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)', // Match old frontend
    plot_bgcolor: 'rgba(0,0,0,0)',  // Match old frontend
    font: { color: '#808080' }      // Match old frontend
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