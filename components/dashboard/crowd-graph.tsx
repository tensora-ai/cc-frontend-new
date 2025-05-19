"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { TimeSeriesPoint, TimeSeriesPointWithLocalTime } from "@/models/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";

interface CrowdGraphProps {
  data: TimeSeriesPoint[];
  isLoading: boolean;
}

export function CrowdGraph({ data, isLoading }: CrowdGraphProps) {
  // Prepare chart data by parsing ISO dates and formatting
  const [chartData, setChartData] = useState<TimeSeriesPointWithLocalTime[]>([]);
  
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
        time: localTime,
        count: point.value,
        timeFormatted: format(localTime, "HH:mm"),
        // Use the localTimestamp if available (from the enhanced TimeSeriesPoint)
        localTimeString: (point as TimeSeriesPoint).timestamp || format(localTime, "yyyy-MM-dd HH:mm:ss")
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
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-64">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-gray-400">No data available for the selected time range</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}