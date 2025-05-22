"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
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
import { DensityDisplay } from "@/components/dashboard/density-display";

// Import types
import { Project, CameraConfig } from "@/models/project";
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
  
  // State for dashboard controls
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date()); // Current local time
  const [lookbackHours, setLookbackHours] = useState<number>(3);
  
  // State for data
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // State for clicked point on graph
  const [clickedTimestamp, setClickedTimestamp] = useState<string | null>(null);
  
  // Handle date changes from control panel
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // Reset clicked point when manually changing date
    setClickedTimestamp(null);
  };
  
  // Handle graph point click
  const handleGraphPointClick = (timestamp: string) => {
    setClickedTimestamp(timestamp);
  };
  
  // Handle resetting to defaults
  const handleResetToDefaults = () => {
    setSelectedDate(new Date());
    setLookbackHours(3);
    setClickedTimestamp(null);
  };
  
  // Load project data
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
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
        
        // Make API request using the correct endpoint structure
        const response = await fetch(`/api/projects/${projectId}/areas/${selectedArea}/predictions/aggregate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            end_date: endDate,
            lookback_hours: lookbackHours,
            half_moving_avg_size: 0 // Removed the moving avg slider as requested
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch time series data: ${response.statusText}`);
        }
        
        const data: AggregateTimeSeriesResponse = await response.json();
        
        // Process the received data
        setTimeSeriesData(data.time_series);
        setLoadingData(false);
      } catch (err) {
        console.error("Failed to fetch time series data:", err);
        setDataError("Failed to load crowd count data. Please try again.");
        setLoadingData(false);
      }
    }
    
    fetchTimeSeriesData();
    
    // Set up interval to refresh data every 30 seconds if we're viewing current time
    // Only auto-refresh if the selected date is close to the current time (within 5 minutes)
    const now = new Date();
    const isViewingCurrentTime = Math.abs(selectedDate.getTime() - now.getTime()) < 5 * 60 * 1000;
    
    let intervalId: NodeJS.Timeout | null = null;
    if (isViewingCurrentTime) {
      intervalId = setInterval(fetchTimeSeriesData, 30000);
    }
    
    // Clean up interval on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [projectId, selectedArea, selectedDate, lookbackHours, timeZone]);
  
  // Calculate stats from time series data
  const calculateStats = useCallback(() => {
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
  }, [timeSeriesData]);
  
  // Get stats
  const stats = calculateStats();
  
  // Get the timestamp to use for image/heatmap/density fetching
  const getDisplayTimestamp = useCallback(() => {
    // Use clicked timestamp if available, otherwise use the selected date
    if (clickedTimestamp) {
      return clickedTimestamp;
    }
    
    // Convert selected date to UTC and format
    const utcDate = fromZonedTime(selectedDate, timeZone);
    return format(utcDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  }, [clickedTimestamp, selectedDate, timeZone]);
  
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
          <div className="grid grid-cols-1 gap-6">
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
  
  // Function to render camera configuration panels
  const renderCameraConfigPanels = (cameraConfigs: CameraConfig[]) => {
    if (cameraConfigs.length === 0) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          <p className="font-medium">No camera configurations</p>
          <p className="text-sm mt-1">This area has no camera configurations. Please add at least one camera configuration.</p>
        </div>
      );
    }
    
    return cameraConfigs.map((config) => {
      // Find the camera for this config to get the name
      const camera = project.cameras.find(c => c.id === config.camera_id);
      const displayTimestamp = getDisplayTimestamp();
      
      return (
        <div key={config.id} className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">{config.name} ({camera?.name || config.camera_id})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Camera Image Panel */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-md font-medium mb-3">Camera View</h4>
              <ImageDisplay 
                projectId={projectId}
                areaId={selectedArea}
                cameraId={config.camera_id}
                positionId={config.position.name}
                timestamp={displayTimestamp}
              />
            </div>
            
            {/* Heatmap Panel */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-md font-medium mb-3">Density Heatmap</h4>
              <HeatmapDisplay
                projectId={projectId}
                areaId={selectedArea}
                cameraId={config.camera_id}
                positionId={config.position.name}
                timestamp={displayTimestamp}
              />
            </div>
            
            {/* Density Panel - Placeholder for now */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-md font-medium mb-3">Density Data</h4>
              <DensityDisplay
                projectId={projectId}
                areaId={selectedArea}
                cameraId={config.camera_id}
                positionId={config.position.name}
                timestamp={displayTimestamp}
              />
            </div>
          </div>
        </div>
      );
    });
  };
  
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
              onReset={handleResetToDefaults}
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
                onPointClick={handleGraphPointClick}
              />
            </div>
            
            {/* Camera Configuration Panels - one set for each camera config */}
            {renderCameraConfigPanels(area.camera_configs)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}