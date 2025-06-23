"use client";

import { useState, useEffect } from "react";
import { ClipboardList, AlertTriangle, RefreshCw } from "lucide-react";
import Plot from 'react-plotly.js';
import { formatTimestampForBlobPath, formatUtcToLocalDisplay } from "@/lib/datetime-utils";
import { CameraConfig } from "@/models/project";
import { CameraTimestamp } from "@/models/dashboard";
import { apiClient } from "@/lib/api-client";

interface UnifiedDensityDisplayProps {
  projectId: string;
  areaId: string;
  timestamp: string;  // UTC ISO string - target timestamp
  cameraConfigs: CameraConfig[];
  cameraTimestamps: CameraTimestamp[]; // Available timestamps for finding nearest
  forceLoading?: boolean;
}

// Coordinate point from transformed density JSON: [x, y, density_value]
type CoordinatePoint = [number, number, number];

interface CameraDensityData {
  cameraId: string;
  positionId: string;
  cameraName: string;
  data: CoordinatePoint[];
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
  hasData: boolean;
  error?: string;
}

interface CombinedDensityData {
  data: number[][];
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
  cameraRegions: {
    cameraId: string;
    cameraName: string;
    bounds: { minX: number, maxX: number, minY: number, maxY: number };
  }[];
}

export function UnifiedDensityDisplay({
  projectId,
  areaId,
  timestamp,
  cameraConfigs,
  cameraTimestamps,
  forceLoading = false
}: UnifiedDensityDisplayProps) {
  console.log("🎯 UnifiedDensityDisplay render - received timestamp:", timestamp);

  const [combinedData, setCombinedData] = useState<CombinedDensityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingCameras, setMissingCameras] = useState<string[]>([]);

  // Helper function to find nearest timestamp for a specific camera/position
  const findNearestTimestamp = (cameraId: string, positionId: string, targetTimestamp: string): string | null => {
    console.log(`🔍 Finding nearest timestamp for camera ${cameraId} at position ${positionId} for target time: ${targetTimestamp}`);

    // If there are no timestamps, return null
    if (cameraTimestamps.length === 0) {
      console.warn("No camera timestamps available to search.");
      return null;
    }

    // Filter timestamps for this camera/position
    const relevantTimestamps = cameraTimestamps.filter(
      ct => ct.camera_id === cameraId && ct.position === positionId
    );

    // If no relevant timestamps, return null
    if (relevantTimestamps.length === 0) {
      console.warn(`No timestamps found for camera ${cameraId} at position ${positionId}.`);
      return null;
    }
    
    // Helper function to ensure proper UTC parsing
    const parseUtcTimestamp = (timestamp: string): number => {
      // Ensure the timestamp ends with 'Z' for proper UTC parsing
      const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
      const date = new Date(utcTimestamp);
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.error(`Invalid timestamp: ${timestamp}`);
        return 0;
      }
      
      return date.getTime();
    };
    
    // Get the target time in milliseconds (UTC)
    const targetTime = parseUtcTimestamp(targetTimestamp);

    // Calculate differences and sort by closest match
    const timestampsWithDifference = relevantTimestamps.map(ct => {
      const timestampTime = parseUtcTimestamp(ct.timestamp);
      const difference = Math.abs(timestampTime - targetTime);
      
      return {
        ...ct,
        timestampTime,
        difference
      };
    });
    
    // Sort by smallest difference
    timestampsWithDifference.sort((a, b) => a.difference - b.difference);
    
    const closest = timestampsWithDifference[0];
    const result = closest.timestamp;

    console.log(`✅ Nearest timestamp found: ${result} (diff: ${closest.difference}ms) for camera ${cameraId} at position ${positionId}`);

    return result;
  };

  // Helper function to filter coordinates based on crop area (OpenCV format)
  const filterCoords = (coords: CoordinatePoint[], crop: [number, number, number, number]): CoordinatePoint[] => {
    const [x, y, width, height] = crop;
    const left = x;           // Left edge is the x coordinate of top-left point
    const top = y;            // Top edge is the y coordinate of top-left point
    const right = x + width;  // Right edge is x + width (extending to the right)
    const bottom = y - height; // Bottom edge is y - height (extending downward in mathematical coordinates)
    
    return coords.filter(([coordX, coordY, val]) => 
      coordX >= left && coordX <= right && coordY >= bottom && coordY <= top
    );
  };

  // Helper function to process individual camera data
  const processCameraData = (
    coords: CoordinatePoint[], 
    heatmapConfig?: [number, number, number, number]
  ): { processedCoords: CoordinatePoint[], bounds: { minX: number, maxX: number, minY: number, maxY: number } } => {
    let processedCoords = coords;
    let bounds;
    
    // Apply cropping if heatmapConfig is provided
    if (heatmapConfig) {
      processedCoords = filterCoords(coords, heatmapConfig);
      
      // Use crop rectangle bounds directly for consistent spatial alignment
      const [x, y, width, height] = heatmapConfig;
      bounds = {
        minX: x,                // Left edge
        maxX: x + width,        // Right edge  
        minY: y - height,       // Bottom edge (Y increases upward, height extends downward)
        maxY: y                 // Top edge
      };
    } else {
      // No crop - calculate bounds from actual data points
      if (processedCoords.length === 0) {
        bounds = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
      } else {
        const minX = Math.min(...processedCoords.map(coord => coord[0]));
        const maxX = Math.max(...processedCoords.map(coord => coord[0]));
        const minY = Math.min(...processedCoords.map(coord => coord[1]));
        const maxY = Math.max(...processedCoords.map(coord => coord[1]));
        bounds = { minX, maxX, minY, maxY };
      }
    }

    return {
      processedCoords,
      bounds
    };
  };

  // Combine all camera data into unified coordinate system
  const combineAllCameraData = (cameraDataList: CameraDensityData[]): CombinedDensityData | null => {
    const validCameras = cameraDataList.filter(cam => cam.hasData);
    
    if (validCameras.length === 0) {
      return null;
    }

    // Find overall bounds
    let globalMinX = Infinity, globalMaxX = -Infinity;
    let globalMinY = Infinity, globalMaxY = -Infinity;

    validCameras.forEach(camera => {
      globalMinX = Math.min(globalMinX, camera.bounds.minX);
      globalMaxX = Math.max(globalMaxX, camera.bounds.maxX);
      globalMinY = Math.min(globalMinY, camera.bounds.minY);
      globalMaxY = Math.max(globalMaxY, camera.bounds.maxY);
    });

    // Create unified grid with 1-unit resolution
    const gridWidth = Math.ceil(globalMaxX - globalMinX);
    const gridHeight = Math.ceil(globalMaxY - globalMinY);
    
    // Initialize grid with zeros
    const combinedGrid: number[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
    
    // Process each camera's data
    validCameras.forEach(camera => {
      camera.data.forEach(([x, y, density]) => {
        // Convert to grid coordinates
        const gridX = Math.floor(x - globalMinX);
        const gridY = Math.floor(y - globalMinY);
        
        // Ensure within bounds
        if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
          // Use maximum value for overlaps
          // Flip Y for proper orientation in mathematical coordinate system (Y increases upward)
          const currentValue = combinedGrid[gridHeight - gridY - 1][gridX];
          combinedGrid[gridHeight - gridY - 1][gridX] = Math.max(currentValue, Math.min(density, 6.0));
        }
      });
    });

    // Create camera regions for identification
    const cameraRegions = validCameras.map(camera => ({
      cameraId: camera.cameraId,
      cameraName: camera.cameraName,
      bounds: camera.bounds
    }));

    return {
      data: combinedGrid,
      bounds: { 
        minX: globalMinX, 
        maxX: globalMaxX, 
        minY: globalMinY, 
        maxY: globalMaxY 
      },
      cameraRegions
    };
  };

  useEffect(() => {
    async function fetchAndCombineDensityData() {
      if (!projectId || !areaId || !timestamp || !cameraConfigs.length) return;

      // If we don't have camera timestamps yet, keep loading state
      if (cameraTimestamps.length === 0) {
        console.log("⏳ Waiting for camera timestamps to load...");
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setMissingCameras([]);

        console.log("🔄 Fetching density data for", cameraConfigs.length, "cameras");

        // Fetch density data for all cameras
        const cameraDataPromises = cameraConfigs.map(async (config): Promise<CameraDensityData> => {
          try {
            // Find the nearest available timestamp for this camera
            const nearestTimestamp = findNearestTimestamp(config.camera_id, config.position.name, timestamp);
            
            if (!nearestTimestamp) {
              return {
                cameraId: config.camera_id,
                positionId: config.position.name,
                cameraName: config.name,
                data: [],
                bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
                hasData: false,
                error: "No timestamps available for this camera"
              };
            }

            const formattedTimestamp = formatTimestampForBlobPath(nearestTimestamp);
            const blobName = `${projectId}-${config.camera_id}-${config.position.name}-${formattedTimestamp}_transformed_density.json`;
            
            console.log(`🔄 Fetching density for ${config.camera_id} (${config.position.name}) with timestamp: ${nearestTimestamp}`);
            
            const rawCoords: CoordinatePoint[] = await apiClient.fetchPredictionJson(blobName);
            
            // Process the coordinates (apply cropping, etc.)
            const { processedCoords, bounds } = processCameraData(rawCoords, config.heatmap_config);
            
            console.log(`📊 Camera ${config.camera_id} (${config.position.name}): ${processedCoords.length} points, bounds:`, bounds);

            return {
              cameraId: config.camera_id,
              positionId: config.position.name,
              cameraName: config.name,
              data: processedCoords,
              bounds,
              hasData: processedCoords.length > 0
            };

          } catch (err) {
            console.error(`Failed to fetch density for camera ${config.camera_id}:`, err);
            let errorMessage = "Failed to load data";
            
            if (err instanceof Error) {
              if (err.message.includes('not found')) {
                errorMessage = "No data available";
              } else {
                errorMessage = err.message;
              }
            }
            
            return {
              cameraId: config.camera_id,
              positionId: config.position.name,
              cameraName: config.name,
              data: [],
              bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
              hasData: false,
              error: errorMessage
            };
          }
        });

        const allCameraData = await Promise.all(cameraDataPromises);
        
        // Track missing cameras
        const missing = allCameraData
          .filter(cam => !cam.hasData)
          .map(cam => `${cam.cameraName} (${cam.positionId})`);
        setMissingCameras(missing);

        // Combine all valid camera data
        const combined = combineAllCameraData(allCameraData);
        
        if (!combined) {
          setError("No density data available for any camera in this area");
        } else {
          setCombinedData(combined);
          console.log("🎯 Combined density data:", combined.bounds, "Camera regions:", combined.cameraRegions.length);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch and combine density data:", err);
        setError("Failed to load density data. Please try again.");
        setLoading(false);
      }
    }

    console.log("🔄 useEffect triggered with timestamp:", timestamp);
    fetchAndCombineDensityData();
  }, [projectId, areaId, timestamp, cameraConfigs, cameraTimestamps]);

  useEffect(() => {
    if (forceLoading) {
      setLoading(true);
      const timeoutId = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [forceLoading]);

  // Calculate min/max values from the actual data
  const getDataRange = (data: number[][]) => {
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const value = data[i][j];
        if (value > 0) { // Only consider non-zero values
          if (value < min) min = value;
          if (value > max) max = value;
        }
      }
    }
    
    // If no valid values found, use defaults
    if (min === Infinity) {
      min = 0;
      max = 1;
    }
    
    return { min, max };
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500 text-sm">Loading unified density data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center p-4">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Error Loading Unified Density Data</p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!combinedData || combinedData.data.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No Unified Density Data Available</p>
          <p className="text-gray-400 text-sm mt-2">No density measurements found for any camera in this area.</p>
        </div>
      </div>
    );
  }

  const data = combinedData.data;
  const bounds = combinedData.bounds;
  const dataHeight = data.length;
  const dataWidth = data[0]?.length || 0;

  // Calculate actual min/max from data
  const { min: dataMin, max: dataMax } = getDataRange(data);

  // Create coordinate arrays for the unified system
  const xCoords = Array.from({ length: dataWidth }, (_, i) =>
    bounds.minX + (i * ((bounds.maxX - bounds.minX) / dataWidth))
  );
  
  const yCoords = Array.from({ length: dataHeight }, (_, i) =>
    bounds.minY + ((dataHeight - 1 - i) * ((bounds.maxY - bounds.minY) / dataHeight))
  );

  // Custom colorscale (same as individual density displays)
  const customColorscale = [
    [0.0, '#0d47a1'],   // Dark blue
    [0.2, '#1976d2'],   // Medium blue  
    [0.4, '#42a5f5'],   // Light blue
    [0.6, '#66bb6a'],   // Green
    [0.8, '#9ccc65'],   // Light green
    [1.0, '#ffeb3b']    // Yellow
  ];

  // Create plot data
  const plotData = [{
    z: data,
    x: xCoords,
    y: yCoords,
    type: 'heatmap',
    colorscale: customColorscale,
    zmin: 0,  
    zmax: 7,  
    hovertemplate: 'X: %{x:.1f}m<br>Y: %{y:.1f}m<br>Density: %{z:.3f}/m²<extra></extra>',
    showscale: true,
    colorbar: {
      title: {
        text: 'people/m²',
        font: { color: '#808080', size: 12 }
      },
      tickfont: { color: '#808080' },
      len: 0.8,
      tickformat: '.0f'
    }
  }];

  const layout = {
    title: '',
    xaxis: {
      title: 'Distance (meters)',
      tickfont: { color: '#808080' },
      titlefont: { color: '#808080' },
      showgrid: false,
      zeroline: false,
      range: [bounds.minX, bounds.maxX]
    },
    yaxis: {
      title: 'Distance (meters)',
      tickfont: { color: '#808080' },
      titlefont: { color: '#808080' },
      showgrid: false,
      zeroline: false,
      scaleanchor: 'x',
      scaleratio: 1,
      range: [bounds.minY, bounds.maxY]
    },
    margin: { l: 60, r: 60, t: 10, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#808080' }
  };

  return (
    <div className="w-full">
      <div className="w-full h-200 bg-white rounded-lg overflow-hidden border">
        <Plot
          data={plotData as any}
          layout={layout as any}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      <div className="mt-2 text-xs text-gray-500 space-y-1">
        <div>Combined Area: {(bounds.maxX - bounds.minX).toFixed(1)}m × {(bounds.maxY - bounds.minY).toFixed(1)}m</div>
        <div>Density range: {dataMin.toFixed(3)} - {dataMax.toFixed(3)} people/m²</div>
        <div>Cameras: {combinedData.cameraRegions.length} combined</div>
        
        {missingCameras.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-md mt-2">
            <p className="font-medium text-sm">Missing density data for:</p>
            <p className="text-xs mt-1">{missingCameras.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}