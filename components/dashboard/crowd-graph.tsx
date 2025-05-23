"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { TimeSeriesPoint } from "@/models/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart3, Info, MousePointerClick } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  TooltipProps,
  ReferenceDot,
  ReferenceLine
} from "recharts";

interface CrowdGraphProps {
  data: TimeSeriesPoint[];
  isLoading: boolean;
  onPointClick: (timestamp: string) => void;
  error?: string | null;  // New error prop for specific error messages
}

interface TimeSeriesPointWithLocalTime {
  timestamp: string;  // Original UTC timestamp for API calls
  time: Date;         // Parsed date object
  count: number;      // The crowd count value
  timeFormatted: string; // Formatted time for display (HH:MM)
}

export function CrowdGraph({ data, isLoading, onPointClick, error }: CrowdGraphProps) {
  // Prepare chart data by parsing ISO dates and formatting
  const [chartData, setChartData] = useState<TimeSeriesPointWithLocalTime[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Get the local timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const formattedData = data.map((point) => {
      // Parse the UTC timestamp
      const utcTime = parseISO(point.timestamp);
      
      // Convert to local time
      const localTime = toZonedTime(utcTime, timeZone);
      
      return {
        timestamp: point.timestamp, // Keep original timestamp for API calls
        time: localTime,
        count: point.value,
        timeFormatted: format(localTime, "HH:mm"),
      };
    });
    
    setChartData(formattedData);
  }, [data]);
  
  // Make sure the selectedPoint is reset when data changes
  useEffect(() => {
    if (data.length > 0 && selectedPoint && !data.some(point => point.timestamp === selectedPoint)) {
      setSelectedPoint(null);
    }
  }, [data, selectedPoint]);
  
  // Calculate y-axis domain with 10% padding above maximum
  const calculateYDomain = () => {
    if (!data || data.length === 0) return [0, 10];
    
    const maxValue = Math.max(...data.map(point => point.value));
    const paddedMax = Math.ceil(maxValue * 1.1); // Add 10% padding
    
    return [0, paddedMax];
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium text-gray-900">{payload[0].payload.timeFormatted}</p>
          <p className="text-[var(--tensora-medium)]">
            Count: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // Handle graph click
  const handleGraphClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedData = data.activePayload[0].payload;
      setSelectedPoint(clickedData.timestamp);
      onPointClick(clickedData.timestamp);
    }
  };
  
  // Add selected time display
  const formatSelectedTime = () => {
    if (!selectedPoint || chartData.length === 0) return null;
    
    const selectedData = chartData.find(point => point.timestamp === selectedPoint);
    if (!selectedData) return null;
    
    return format(selectedData.time, "MMMM d, yyyy HH:mm:ss");
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-64">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }
  
  // Error states with specific messages
  if (error) {
    const isPartialDataError = error.includes("Some cameras in this area do not have data");
    const isNoDataError = error.includes("No prediction data available");
    
    return (
      <div className="w-full h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
        <div className="text-center p-6">
          {isPartialDataError ? (
            <>
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-amber-700 mb-2">Insufficient Data</h3>
              <p className="text-amber-600 text-sm max-w-md">
                {error}
              </p>
              <p className="text-amber-500 text-xs mt-2">
                Please ensure all cameras in this area have prediction data for the selected time range.
              </p>
            </>
          ) : isNoDataError ? (
            <>
              <Info className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-blue-700 mb-2">No Data Available</h3>
              <p className="text-blue-600 text-sm max-w-md">
                {error}
              </p>
              <p className="text-blue-500 text-xs mt-2">
                Try expanding the time range or selecting a different date.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-red-700 mb-2">Error Loading Data</h3>
              <p className="text-red-600 text-sm max-w-md">
                {error}
              </p>
              <p className="text-red-500 text-xs mt-2">
                Please check your connection and try again.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  
  // Empty state (no error, but no data)
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
        <div className="text-center p-6">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Data to Display</h3>
          <p className="text-gray-500 text-sm">
            Configure your settings and click &ldquo;Apply&rdquo; to load prediction data.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Helpful user hint about interactivity */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 bg-blue-50 p-2 rounded-md border border-blue-100">
        <MousePointerClick className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <p>
          Click on any point in the graph to view corresponding camera images, heatmaps, and density data at that specific time.
        </p>
      </div>
      
      {/* Selected time indicator */}
      {selectedPoint && (
        <div className="mb-3 p-2 bg-[var(--tensora-light)]/10 border border-[var(--tensora-medium)]/20 rounded-md">
          <p className="text-sm font-medium flex items-center">
            <span className="inline-block h-3 w-3 bg-[var(--tensora-dark)] rounded-full mr-2"></span>
            Selected Time: <span className="ml-1 text-[var(--tensora-dark)]">{formatSelectedTime()}</span>
          </p>
        </div>
      )}
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onClick={handleGraphClick}
            className="cursor-pointer"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="timeFormatted"
              tickMargin={10}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              domain={calculateYDomain()}
              tickMargin={10}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--tensora-medium)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: "var(--tensora-dark)" }}
            />
            
            {/* Show selected point with enhanced visibility - note this is separate from the tooltip hover */}
            {selectedPoint && chartData.map((point, index) => (
              point.timestamp === selectedPoint ? (
                <React.Fragment key={index}>
                  {/* Vertical reference line */}
                  <ReferenceLine 
                    x={point.timeFormatted} 
                    stroke="var(--tensora-dark)" 
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: 'Selected Time',
                      position: 'top',
                      fill: 'var(--tensora-dark)',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  />
                  {/* The highlighted point */}
                  <ReferenceDot
                    x={point.timeFormatted}
                    y={point.count}
                    r={8}
                    fill="var(--tensora-dark)"
                    stroke="white"
                    strokeWidth={2}
                  />
                </React.Fragment>
              ) : null
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}