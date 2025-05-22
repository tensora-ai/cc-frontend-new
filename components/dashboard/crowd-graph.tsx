"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { TimeSeriesPoint } from "@/models/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart3, Info } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  TooltipProps,
  ReferenceDot 
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
            Configure your settings and click "Apply" to load prediction data.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-64">
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
          
          {/* Show selected point with a reference dot */}
          {selectedPoint && chartData.map((point, index) => (
            point.timestamp === selectedPoint ? (
              <ReferenceDot
                key={index}
                x={point.timeFormatted}
                y={point.count}
                r={6}
                fill="var(--tensora-dark)"
                stroke="white"
                strokeWidth={2}
              />
            ) : null
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}