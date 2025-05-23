"use client";

import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ClipboardList, AlertTriangle, RefreshCw, Maximize2 } from "lucide-react";
import Plot from 'react-plotly.js';
import { Button } from "@/components/ui/button";
import { FullscreenDisplayDialog } from "./fullscreen-display-dialog";
import { DensityData } from "@/models/dashboard";

interface DensityDisplayProps {
  projectId: string;
  areaId: string;
  cameraId: string;
  positionId: string;
  timestamp: string;  // This is a UTC ISO string
  heatmapConfig?: [number, number, number, number]; // [left, top, right, bottom]
  forceLoading?: boolean;
}

export function DensityDisplay({
  projectId,
  areaId,
  cameraId,
  positionId,
  timestamp,
  heatmapConfig,
  forceLoading = false
}: DensityDisplayProps) {
  const [densityData, setDensityData] = useState<DensityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for fullscreen dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchDensityData() {
      if (!projectId || !areaId || !cameraId || !positionId || !timestamp) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/projects/${projectId}/areas/${areaId}/nearest-density?` +
          `camera_id=${encodeURIComponent(cameraId)}&` +
          `position_id=${encodeURIComponent(positionId)}&` +
          `timestamp=${encodeURIComponent(timestamp)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch density data: ${response.statusText}`);
        }

        const densityData: DensityData = await response.json();
        console.log("Density data fetched:", densityData);
        setDensityData(densityData);
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch density data:", err);
        setError("Failed to load density data. Please try again.");
        setLoading(false);
      }
    }

    fetchDensityData();
  }, [projectId, areaId, cameraId, positionId, timestamp]);

  useEffect(() => {
    if (forceLoading) {
      setLoading(true);
      const timeoutId = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [forceLoading]);

  const formatTimestamp = (isoString: string) => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const date = parseISO(isoString);
      return formatInTimeZone(date, timeZone, "MMM d, yyyy HH:mm:ss");
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown time";
    }
  };
  
  const handleOpenDialog = () => {
    if (densityData && densityData.data) {
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

  if (!densityData || densityData.data.length === 0) {
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

  const data = densityData.data;
  const dataHeight = data.length;
  const dataWidth = data[0]?.length || 0;

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

  const plotData = [{
    z: data,
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
        <div>Captured: {formatTimestamp(densityData.timestamp)}</div>
        <div>Grid: {dataWidth} × {dataHeight} cells ({physicalWidth}m × {physicalHeight}m)</div>
        {heatmapConfig && (
          <div>Crop area: [{heatmapConfig.join(', ')}] meters</div>
        )}
      </div>
      
      {/* Fullscreen dialog for density display */}
      <FullscreenDisplayDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={`Density: ${cameraId} (${positionId})`}
        timestamp={formatTimestamp(densityData.timestamp)}
        displayType="density"
        densityData={densityData.data}
        heatmapConfig={heatmapConfig}
      />
    </div>
  );
}