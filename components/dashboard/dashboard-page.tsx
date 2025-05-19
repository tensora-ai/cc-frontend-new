"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Import our custom dashboard components
import { ControlPanel } from "@/components/dashboard/control-panel";
import { StatsPanel } from "@/components/dashboard/stats-panel";
import { CrowdGraph } from "@/components/dashboard/crowd-graph";
import { ImageDisplay } from "@/components/dashboard/image-display";
import { HeatmapDisplay } from "@/components/dashboard/heatmap-display";

// Import types
import { Project } from "@/models/project";
import { AggregateTimeSeriesResponse, TimeSeriesPoint } from "@/models/dashboard";

export default function DashboardPage() {
  const params = useParams();
  const projectId = params.project_id as string;
  
  // Get the local timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // State for project data
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for selected area
  const [selectedArea, setSelectedArea] = useState<string>("");
  
  // State for controls - store dates in LOCAL time for UI display
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Start with current time in local timezone
    return new Date();
  });
  const [lookbackHours, setLookbackHours] = useState<number>(3);
  const [movingAvgSize, setMovingAvgSize] = useState<number>(2);
  
  // State for data
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Handle date changes from control panel - these are already in UTC from the control panel
  const handleDateChange = (newDate: Date) => {
    // Convert the UTC date to local time for UI display
    const localDate = toZonedTime(newDate, timeZone);
    setSelectedDate(localDate);
  };
  
  // Load project data
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.statusText}`);
        }
        
        const data = await response.json();
        setProject(data);
        
        // Set the first area as selected by default
        if (data.areas && data.areas.length > 0) {
          setSelectedArea(data.areas[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError("Failed to load project data. Please try again later.");
        setLoading(false);
      }
    }
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);
  
  // Fetch time series data when parameters change
  useEffect(() => {
    async function fetchTimeSeriesData() {
      if (!projectId || !selectedArea) return;
      
      try {
        setLoadingData(true);
        setDataError(null);
        
        // Convert local time to UTC for API request
        const utcDate = fromZonedTime(selectedDate, timeZone);
        
        // Format the date in UTC for the API
        const endDate = format(utcDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
        
        // In a real app, this would be an API call
        const response = await fetch('/api/predictions/aggregate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: projectId,
            area: selectedArea,
            end_date: endDate,
            lookback_hours: lookbackHours,
            half_moving_avg_size: movingAvgSize
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch time series data: ${response.statusText}`);
        }
        
        const data: AggregateTimeSeriesResponse = await response.json();
        
        // Process the received data - transform UTC timestamps to local time
        const processedData = data.time_series.map(point => ({
          ...point,
          // Keep the original timestamp string but also add a localized version for display
          localTimestamp: formatInTimeZone(
            parseISO(point.timestamp),
            timeZone,
            'yyyy-MM-dd HH:mm:ss'
          )
        }));
        
        setTimeSeriesData(processedData);
        setLoadingData(false);
      } catch (err) {
        console.error("Failed to fetch time series data:", err);
        setDataError("Failed to load crowd count data. Please try again.");
        setLoadingData(false);
      }
    }
    
    fetchTimeSeriesData();
    
    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(fetchTimeSeriesData, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [projectId, selectedArea, selectedDate, lookbackHours, movingAvgSize, timeZone]);
  
  // Calculate stats from time series data
  const calculateStats = () => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      return { current: 0, maximum: 0, average: 0, minimum: 0 };
    }
    
    const values = timeSeriesData.map(point => point.value);
    
    return {
      current: values[values.length - 1],
      maximum: Math.max(...values),
      average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      minimum: Math.min(...values)
    };
  };
  
  // Get stats
  const stats = calculateStats();
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href={`/project/${projectId}`} className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{error || "Project not found"}</p>
            <p className="text-sm mt-1">Please go back and select a valid project.</p>
            <div className="mt-4">
              <Link href={`/project/${projectId}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If no areas are available
  if (project.areas.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href={`/project/${projectId}`} className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--tensora-dark)]">{project.name} Dashboard</h1>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">No monitoring areas configured</p>
            <p className="text-sm mt-1">Please add areas and camera configurations to your project first.</p>
            <div className="mt-4">
              <Link href={`/project/${projectId}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Configure Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header with back button and project name */}
      <div className="flex items-center mb-6">
        <Link href={`/project/${projectId}`} className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--tensora-dark)]">{project.name} Dashboard</h1>
      </div>
      
      {/* Area Tabs */}
      <Tabs
        value={selectedArea}
        onValueChange={setSelectedArea}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {project.areas.map((area) => (
            <TabsTrigger 
              key={area.id} 
              value={area.id}
              className="px-4 py-2"
            >
              {area.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Tab Content for each area */}
        {project.areas.map((area) => (
          <TabsContent key={area.id} value={area.id} className="space-y-6 pt-4">
            {/* Control Panel */}
            <ControlPanel 
              date={selectedDate}
              onDateChange={handleDateChange}
              lookbackHours={lookbackHours}
              onLookbackChange={setLookbackHours}
              movingAvgSize={movingAvgSize}
              onMovingAvgChange={setMovingAvgSize}
            />
            
            {/* Stats Panel */}
            <StatsPanel 
              current={stats.current}
              maximum={stats.maximum}
              average={stats.average}
              minimum={stats.minimum}
            />
            
            {/* Error message if data loading failed */}
            {dataError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">{dataError}</p>
                <p className="text-sm mt-1">Try adjusting your filters or refreshing the page.</p>
              </div>
            )}
            
            {/* Graph */}
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Crowd Count</h2>
              <CrowdGraph 
                data={timeSeriesData} 
                isLoading={loadingData} 
              />
            </div>
            
            {/* Visualizations - Images and Heatmap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camera Images */}
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h2 className="text-lg font-medium mb-4">Camera View</h2>
                <ImageDisplay 
                  projectId={projectId}
                  areaId={area.id} 
                  selectedTime={selectedDate}
                />
              </div>
              
              {/* Heatmap */}
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h2 className="text-lg font-medium mb-4">Density Heatmap</h2>
                <HeatmapDisplay 
                  projectId={projectId}
                  areaId={area.id}
                  selectedTime={selectedDate}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}