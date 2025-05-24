"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { 
  getLocalNow, 
  formatUtcDateToIsoString 
} from "@/lib/datetime-utils";
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
import { 
  AggregateTimeSeriesResponse, 
  TimeSeriesPoint, 
  CameraTimestamp 
} from "@/models/dashboard";

// Dashboard states
type DashboardState = 'initial' | 'loading' | 'success' | 'error' | 'empty';

// Type for storing camera timestamps by camera+position
type CameraTimestampMap = Record<string, string>; // key: "cameraId-positionId", value: timestamp

export default function DashboardPage() {
  const params = useParams();
  const projectId = params.project_id as string;
  
  // State for project data
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for selected area
  const [selectedArea, setSelectedArea] = useState<string>("");
  
  // State for dashboard controls (with defaults)
  const getDefaultDate = () => getLocalNow();
  const getDefaultLookback = () => 3;
  
  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate);
  const [lookbackHours, setLookbackHours] = useState<number>(getDefaultLookback);
  
  // Dashboard state management
  const [dashboardState, setDashboardState] = useState<DashboardState>('initial');
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [cameraTimestamps, setCameraTimestamps] = useState<CameraTimestamp[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // State for clicked point on graph
  const [clickedTimestamp, setClickedTimestamp] = useState<string | null>(null);
  
  // State for display component loading
  const [displayComponentsLoading, setDisplayComponentsLoading] = useState<boolean>(false);

  // State to trigger refresh of components
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State to store calculated timestamps for each camera configuration
  const [cameraConfigTimestamps, setCameraConfigTimestamps] = useState<CameraTimestampMap>({});
  
  // Handle date changes from control panel
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // Reset clicked point when manually changing date
    setClickedTimestamp(null);
  };
  
  // Handle resetting to defaults
  const handleResetToDefaults = () => {
    setSelectedDate(getDefaultDate());
    setLookbackHours(getDefaultLookback());
    setClickedTimestamp(null);
  };
  
  // Function to set the clicked timestamp to the latest data point
  const selectLatestDataPoint = useCallback(() => {
    if (timeSeriesData.length > 0) {
      // Find the latest timestamp in the data
      const latestPoint = timeSeriesData[timeSeriesData.length - 1];
      setClickedTimestamp(latestPoint.timestamp);
    }
  }, [timeSeriesData]);

  // Find the nearest available timestamp for a camera configuration
  const findNearestTimestamp = useCallback((
    cameraId: string, 
    positionId: string, 
    targetTimestamp: string
  ): string => {
    console.log("🔍 findNearestTimestamp called with:", {
      cameraId, 
      positionId, 
      targetTimestamp,
      availableTimestamps: cameraTimestamps.length
    });

    // If there are no timestamps, return the target timestamp
    if (cameraTimestamps.length === 0) {
      return targetTimestamp;
    }

    // Filter timestamps for this camera/position
    const relevantTimestamps = cameraTimestamps.filter(
      ct => ct.camera_id === cameraId && ct.position === positionId
    );

    // If no relevant timestamps, return the target timestamp
    if (relevantTimestamps.length === 0) {
      return targetTimestamp;
    }
    
    // Get the target time in milliseconds (UTC)
    const targetTime = new Date(targetTimestamp).getTime();
    
    // Sort by time difference - all cameraTimestamps are already in UTC
    relevantTimestamps.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return Math.abs(timeA - targetTime) - Math.abs(timeB - targetTime);
    });

    const result = relevantTimestamps[0].timestamp;
    console.log("🔍 findNearestTimestamp returning:", result);
    return result;
  }, [cameraTimestamps]);

  // Check if we have valid prediction data
  const hasValidData = dashboardState === 'success' && timeSeriesData.length > 0;

  // Function to calculate and update all camera configuration timestamps
  const updateCameraConfigTimestamps = useCallback(() => {
    if (!project || !hasValidData) return;

    console.log("🔄 Updating camera config timestamps...");
    console.log("🔄 clickedTimestamp:", clickedTimestamp);
    console.log("🔄 selectedDate:", selectedDate);

    // Determine the target timestamp (either clicked or selected date)
    const targetTimestamp = clickedTimestamp || formatUtcDateToIsoString(selectedDate);
    console.log("🔄 targetTimestamp:", targetTimestamp);

    const newTimestamps: CameraTimestampMap = {};

    // Calculate timestamp for each camera configuration in the selected area
    const selectedAreaData = project.areas.find(area => area.id === selectedArea);
    if (selectedAreaData) {
      selectedAreaData.camera_configs.forEach((config) => {
        const key = `${config.camera_id}-${config.position.name}`;
        const timestamp = findNearestTimestamp(config.camera_id, config.position.name, targetTimestamp);
        newTimestamps[key] = timestamp;
        
        console.log(`🔄 Camera config ${key}: ${timestamp}`);
      });
    }

    // Update the state
    setCameraConfigTimestamps(newTimestamps);
    console.log("🔄 Updated camera config timestamps:", newTimestamps);
  }, [project, selectedArea, clickedTimestamp, selectedDate, findNearestTimestamp, hasValidData]);

  // Update camera timestamps whenever relevant state changes
  useEffect(() => {
    updateCameraConfigTimestamps();
  }, [updateCameraConfigTimestamps]);

  // Handle apply button - fetch data
  const handleApplySettings = async () => {
    if (!projectId || !selectedArea) return;
    
    try {
      setDashboardState('loading');
      setDataError(null);
      setClickedTimestamp(null);
      
      // Convert local time to UTC for API request
      const endDate = formatUtcDateToIsoString(selectedDate);
      
      // Make API request
      const response = await fetch(`/api/projects/${projectId}/areas/${selectedArea}/predictions/aggregate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          end_date: endDate,
          lookback_hours: lookbackHours,
          half_moving_avg_size: 0
        }),
      });
      
      if (!response.ok) {
        if (response.status === 422) {
          // Partial data - some cameras have data, others don't
          setDataError("Not enough prediction data available. Some cameras in this area do not have data while others do.");
          setDashboardState('error');
        } else {
          // Generic error
          setDataError("Failed to fetch prediction data. Please try again.");
          setDashboardState('error');
        }
        return;
      }
      
      const data: AggregateTimeSeriesResponse = await response.json();

      console.log("Fetched time series data:", data);
      
      // Check if we got empty time series
      if (!data.time_series || data.time_series.length === 0) {
        setDataError("No prediction data available within the selected time range.");
        setDashboardState('empty');
        setTimeSeriesData([]);
        setCameraTimestamps([]);
      } else {
        // Success - we have valid data
        setTimeSeriesData(data.time_series);
        setCameraTimestamps(data.camera_timestamps || []);
        setDashboardState('success');
        
        // Auto-select the latest data point when data is loaded
        setTimeout(() => {
          selectLatestDataPoint();
        }, 100);
      }
      
    } catch (err) {
      console.error("Failed to fetch time series data:", err);
      setDataError("Failed to fetch prediction data. Please try again.");
      setDashboardState('error');
    }
  };
  
  // Handle graph point click
  const handleGraphPointClick = (timestamp: string) => {
    console.log("🔍 Graph clicked with timestamp:", timestamp);
    console.log("🔍 Previous clickedTimestamp:", clickedTimestamp);

    // Set the clicked timestamp to the selected point
    setClickedTimestamp(timestamp);
    setRefreshTrigger(prev => prev + 1); // Trigger a re-render to update components

    console.log("🔍 After setClickedTimestamp - should update on next render");

    // Trigger loading for display components
    setDisplayComponentsLoading(true);
    
    // Reset loading after a brief delay (components will handle their own loading)
    setTimeout(() => {
      setDisplayComponentsLoading(false);
    }, 100);
  };

  useEffect(() => {
    console.log("📍 clickedTimestamp state changed to:", clickedTimestamp);
  }, [clickedTimestamp]);

  // Log when camera config timestamps change
  useEffect(() => {
    console.log("📍 cameraConfigTimestamps state changed to:", cameraConfigTimestamps);
  }, [cameraConfigTimestamps]);
  
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
    // Only show if we have valid data
    if (!hasValidData) return null;
    
    if (cameraConfigs.length === 0) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          <p className="font-medium">No camera configurations</p>
          <p className="text-sm mt-1">This area has no camera configurations. Please add at least one camera configuration.</p>
        </div>
      );
    }
    
    return cameraConfigs.map((config) => {
      // Get timestamp from state instead of calculating during render
      const configKey = `${config.camera_id}-${config.position.name}`;
      const cameraTimestamp = cameraConfigTimestamps[configKey] || formatUtcDateToIsoString(selectedDate);
      
      console.log(`📷 Rendering config ${configKey} with timestamp:`, cameraTimestamp);
      
      return (
        <div key={config.id} className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {(project.cameras.find(c => c.id === config.camera_id)?.name ?? "Unknown Camera")} ({config.position.name})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Camera Image Panel */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-md font-medium mb-3">Camera View</h4>
              <ImageDisplay 
                projectId={projectId}
                cameraId={config.camera_id}
                positionId={config.position.name}
                timestamp={cameraTimestamp}
                refreshTrigger={refreshTrigger}
                forceLoading={displayComponentsLoading}
              />
            </div>
            
            {/* Heatmap Panel */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-md font-medium mb-3">Heatmap</h4>
              <HeatmapDisplay
                projectId={projectId}
                cameraId={config.camera_id}
                positionId={config.position.name}
                timestamp={cameraTimestamp}
                refreshTrigger={refreshTrigger}
                forceLoading={displayComponentsLoading}
              />
            </div>
            
            {/* Density Panel */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-md font-medium mb-3">m²-Density</h4>
              <DensityDisplay
                projectId={projectId}
                cameraId={config.camera_id}
                positionId={config.position.name}
                timestamp={cameraTimestamp}
                refreshTrigger={refreshTrigger}
                forceLoading={displayComponentsLoading}
              />
            </div>
          </div>
        </div>
      );
    });
  };
  
  // Function to render dashboard content for an area
  const renderAreaContent = (area: typeof project.areas[0]) => (
    <div className="space-y-6 pt-4">
      {/* Control Panel - Always shown */}
      <ControlPanel 
        date={selectedDate}
        onDateChange={handleDateChange}
        lookbackHours={lookbackHours}
        onLookbackChange={setLookbackHours}
        onReset={handleResetToDefaults}
        onApply={handleApplySettings}
        loading={dashboardState === 'loading'}
        showApplyButton={true}
      />
      
      {/* Show content based on dashboard state */}
      {dashboardState !== 'initial' && (
        <>
          {/* Stats Panel - only show with valid data, positioned above graph */}
          {hasValidData && (
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Statistics Overview</h2>
              <StatsPanel 
                current={stats.current}
                maximum={stats.maximum}
                average={stats.average}
                minimum={stats.minimum}
              />
            </div>
          )}
          
          {/* Crowd Graph */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Crowd Count</h2>
            <CrowdGraph 
              data={timeSeriesData} 
              isLoading={dashboardState === 'loading'}
              onPointClick={handleGraphPointClick}
              error={dataError}
            />
          </div>
          
          {/* Camera Configuration Panels - only with valid data */}
          {renderCameraConfigPanels(area.camera_configs)}
        </>
      )}
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header with back button and project name */}
      <div className="flex items-center mb-6">
        <Link href={`/project/${projectId}`} className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--tensora-dark)]">{project.name} Dashboard</h1>
      </div>
      
      {/* Conditional rendering based on number of areas */}
      {project.areas.length === 1 ? (
        // Single area - no tabs, just area name
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[var(--tensora-dark)]">{project.areas[0].name}</h2>
          </div>
          {renderAreaContent(project.areas[0])}
        </div>
      ) : (
        // Multiple areas - use tabs
        <Tabs
          value={selectedArea}
          onValueChange={(value) => {
            setSelectedArea(value);
            // Reset dashboard state when switching areas
            setDashboardState('initial');
            setTimeSeriesData([]);
            setCameraTimestamps([]);
            setDataError(null);
            setClickedTimestamp(null);
            setCameraConfigTimestamps({});
          }}
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
            <TabsContent key={area.id} value={area.id}>
              {renderAreaContent(area)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}