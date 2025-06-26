"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { 
  getLocalNow, 
  formatUtcDateToIsoString
} from "@/lib/datetime-utils";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Shield, BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Import dashboard components
import { ControlPanel } from "@/components/dashboard/control-panel";
import { StatsPanel } from "@/components/dashboard/stats-panel";
import { CrowdGraph } from "@/components/dashboard/crowd-graph";
import { ImageDisplay } from "@/components/dashboard/image-display";
import { HeatmapDisplay } from "@/components/dashboard/heatmap-display";
import { UnifiedDensityDisplay } from "@/components/dashboard/unified-density-display";

// Import types
import { Project, CameraConfig } from "@/models/project";
import {
  TimeSeriesPoint, 
  CameraTimestamp 
} from "@/models/dashboard";

// Import auth components
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";

// Dashboard states
type DashboardState = 'initial' | 'loading' | 'success' | 'error' | 'empty';

// Access denied component for dashboard
function DashboardAccessDenied({ projectId }: { projectId: string }) {
  const auth = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <Shield className="h-8 w-8 text-red-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Dashboard Access Denied
          </h2>

          {/* User info */}
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Signed in as:</p>
            <p className="font-medium text-gray-900">{auth.display.getUserDisplayName()}</p>
            <p className="text-sm text-gray-500">{auth.display.getUserRoleDisplay()}</p>
          </div>

          {/* Reason */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-800 mb-2">
                  No Access to Project Dashboard
                </p>
                <p className="text-sm text-red-700">
                  You do not have permission to view the dashboard for project "{projectId}".
                </p>
              </div>
            </div>
          </div>

          {/* Available actions */}
          <div className="text-left mb-6">
            <p className="text-sm font-medium text-gray-900 mb-2">What you can do:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Contact your administrator to request access to this project
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Return to the project list to view projects you have access to
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Check that you're using the correct project ID
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)] text-white">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
              </Button>
            </Link>
            <Button variant="outline" onClick={auth.logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main dashboard content component
function DashboardPageContent() {
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
  
  // Live mode state
  const [liveMode, setLiveMode] = useState<boolean>(false);
  const [liveModeCountdown, setLiveModeCountdown] = useState<number>(30);
  
  // Dashboard state management
  const [dashboardState, setDashboardState] = useState<DashboardState>('initial');
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [cameraTimestamps, setCameraTimestamps] = useState<CameraTimestamp[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // State for clicked timestamp and pre-calculated camera timestamps
  const [clickedTimestamp, setClickedTimestamp] = useState<string | null>(null);
  const [cameraConfigTimestamps, setCameraConfigTimestamps] = useState<Record<string, string | null>>({});

  // Use refs to track if we're currently processing a request to prevent race conditions
  const isProcessingRequest = useRef(false);
  const currentRequestId = useRef(0);

  // Check if we have valid prediction data
  const hasValidData = dashboardState === 'success' && timeSeriesData.length > 0;

  // Helper function to find nearest timestamp from array - memoized with useCallback
  const findNearestTimestampFromArray = useCallback((
    cameraId: string, 
    positionId: string, 
    targetTimestamp: string,
    availableTimestamps: CameraTimestamp[]
  ): string | null => {
    
    console.log(`🔍 Finding nearest timestamp for ${cameraId}-${positionId}, target: ${targetTimestamp}`);

    // Filter timestamps for this camera/position from the provided array
    const relevantTimestamps = availableTimestamps.filter(
      ct => ct.camera_id === cameraId && ct.position === positionId
    );

    if (relevantTimestamps.length === 0) {
      console.warn(`⚠️ No timestamps found for ${cameraId}-${positionId}`);
      return null;
    }
    
    // Helper function to parse UTC timestamps
    const parseUtcTimestamp = (timestamp: string): number => {
      const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
      const date = new Date(utcTimestamp);
      
      if (isNaN(date.getTime())) {
        console.error(`Invalid timestamp: ${timestamp}`);
        return 0;
      }
      
      return date.getTime();
    };
    
    // Find closest match
    const targetTime = parseUtcTimestamp(targetTimestamp);
    let closest = relevantTimestamps[0];
    let smallestDiff = Math.abs(parseUtcTimestamp(closest.timestamp) - targetTime);
    
    for (const ct of relevantTimestamps) {
      const diff = Math.abs(parseUtcTimestamp(ct.timestamp) - targetTime);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closest = ct;
      }
    }
    
    console.log(`✅ Found: ${closest.timestamp} (diff: ${smallestDiff}ms)`);
    return closest.timestamp;
  }, []);

  // Calculate timestamps for camera configs when user clicks on graph
  useEffect(() => {
    // Only handle user clicks on the graph, not initial data loading
    if (!clickedTimestamp || !project || !selectedArea || cameraTimestamps.length === 0) {
      return;
    }
    
    console.log("👆 User clicked on graph, updating camera timestamps for:", clickedTimestamp);
    
    const selectedAreaData = project.areas.find(area => area.id === selectedArea);
    if (!selectedAreaData) return;

    const newTimestamps: Record<string, string | null> = {};
    
    selectedAreaData.camera_configs.forEach((config) => {
      const key = `${config.camera_id}-${config.position.name}`;
      const timestamp = findNearestTimestampFromArray(
        config.camera_id, 
        config.position.name, 
        clickedTimestamp,
        cameraTimestamps
      );
      newTimestamps[key] = timestamp;
    });

    setCameraConfigTimestamps(newTimestamps);
    
  }, [clickedTimestamp, project, selectedArea, cameraTimestamps, findNearestTimestampFromArray]);
  
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
  
  const handleGraphPointClick = (timestamp: string) => {
    console.log("🔍 Graph clicked with timestamp:", timestamp);
    // Just set the timestamp - the useEffect will handle the rest
    setClickedTimestamp(timestamp);
  };

  // FIXED: Atomic handleApplySettings function with proper race condition handling
  const handleApplySettings = useCallback(async () => {
    if (!projectId || !selectedArea) return;
    
    // Prevent multiple simultaneous requests
    if (isProcessingRequest.current) {
      console.log("🚫 Request already in progress, skipping");
      return;
    }
    
    // Generate unique request ID to handle race conditions
    const requestId = ++currentRequestId.current;
    isProcessingRequest.current = true;
    
    try {
      console.log(`🔄 Starting fresh dashboard request #${requestId}`);
      
      // STEP 1: Complete state reset - blank slate
      setDashboardState('loading');
      setDataError(null);
      setTimeSeriesData([]);
      setCameraTimestamps([]);
      setCameraConfigTimestamps({});
      setClickedTimestamp(null);
      
      // STEP 2: Make API request with current state values
      const endDate = formatUtcDateToIsoString(selectedDate);
      console.log(`📡 API Request #${requestId}:`, { endDate, lookbackHours, selectedArea });
      
      const data = await apiClient.aggregatePredictions(projectId, selectedArea, {
        end_date: endDate,
        lookback_hours: lookbackHours,
        half_moving_avg_size: 0
      });
      
      // Check if this request is still the latest one
      if (requestId !== currentRequestId.current) {
        console.log(`🚫 Request #${requestId} is outdated, ignoring response`);
        return;
      }
      
      console.log(`📊 API Response #${requestId}:`, {
        timeSeriesPoints: data.time_series?.length || 0,
        cameraTimestamps: data.camera_timestamps?.length || 0
      });
      
      // STEP 3: Validate response
      if (!data.time_series || data.time_series.length === 0) {
        setDataError("No prediction data available within the selected time range.");
        setDashboardState('empty');
        return;
      }
      
      // STEP 4: Atomic state update with new data
      setTimeSeriesData(data.time_series);
      setCameraTimestamps(data.camera_timestamps || []);
      setDashboardState('success');
      
      // STEP 5: Auto-select latest timestamp and calculate camera timestamps
      const latestTimestamp = data.time_series[data.time_series.length - 1].timestamp;
      console.log(`🎯 Auto-selecting latest timestamp: ${latestTimestamp}`);
      
      // Calculate camera config timestamps immediately with fresh data
      const selectedAreaData = project?.areas.find(area => area.id === selectedArea);
      if (selectedAreaData && data.camera_timestamps) {
        const newCameraConfigTimestamps: Record<string, string | null> = {};
        
        selectedAreaData.camera_configs.forEach((config) => {
          const key = `${config.camera_id}-${config.position.name}`;
          const nearestTimestamp = findNearestTimestampFromArray(
            config.camera_id, 
            config.position.name, 
            latestTimestamp,
            data.camera_timestamps // Use fresh data directly
          );
          newCameraConfigTimestamps[key] = nearestTimestamp;
          
          console.log(`📷 ${key}: ${nearestTimestamp}`);
        });
        
        // Set everything at once to avoid race conditions
        setCameraConfigTimestamps(newCameraConfigTimestamps);
        setClickedTimestamp(latestTimestamp);
      }
      
      console.log(`✅ Dashboard update complete #${requestId}`);
      
    } catch (err) {
      // Check if this request is still the latest one
      if (requestId !== currentRequestId.current) {
        console.log(`🚫 Request #${requestId} error ignored (outdated)`);
        return;
      }
      
      console.error(`❌ Dashboard request #${requestId} failed:`, err);
      
      // Clear everything on error
      setTimeSeriesData([]);
      setCameraTimestamps([]);
      setCameraConfigTimestamps({});
      setClickedTimestamp(null);
      
      if (err instanceof Error) {
        if (err.message.includes('422')) {
          setDataError("Not enough prediction data available. Some cameras in this area do not have data while others do.");
        } else {
          setDataError(err.message);
        }
      } else {
        setDataError("Failed to fetch prediction data. Please try again.");
      }
      setDashboardState('error');
    } finally {
      isProcessingRequest.current = false;
    }
  }, [projectId, selectedArea, selectedDate, lookbackHours, project, findNearestTimestampFromArray]);

  // Handle live mode toggle
  const handleLiveModeToggle = (enabled: boolean) => {
    setLiveMode(enabled);
    
    if (enabled) {
      console.log("🔴 Live mode enabled");
      setSelectedDate(getLocalNow());
      // The handleApplySettings call will handle all the state management
      handleApplySettings();
      setLiveModeCountdown(30);
    } else {
      setLiveModeCountdown(30);
    }
  };

  // FIXED: Live mode timer effect with proper dependencies
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let countdownId: NodeJS.Timeout;

    if (liveMode) {
      // Main refresh timer - use latest handleApplySettings function
      intervalId = setInterval(() => {
        console.log("🔄 Live mode refresh");
        setSelectedDate(getLocalNow());
        // Call handleApplySettings directly - it will use current state
        handleApplySettings();
        setLiveModeCountdown(30);
      }, 30000);

      // Countdown timer
      countdownId = setInterval(() => {
        setLiveModeCountdown(prev => prev <= 1 ? 30 : prev - 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (countdownId) clearInterval(countdownId);
    };
  }, [liveMode, handleApplySettings]); // FIXED: Include handleApplySettings in dependencies
  
  // Load project data with enhanced error handling
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        
        const projectData = await apiClient.getProject(projectId);
        setProject(projectData);
        
        // Set the first area as selected by default
        if (projectData.areas && projectData.areas.length > 0) {
          setSelectedArea(projectData.areas[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch project details:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load project data. Please try again later.");
        }
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
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }
  
  // Error state - differentiate between permission and other errors
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
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
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
          <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--tensora-dark)]">{project.name} Dashboard</h1>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">No monitoring areas configured</p>
            <p className="text-sm mt-1">Please add areas and camera configurations to your project first.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // RENDERING LOGIC: Use pre-calculated timestamps to ensure proper re-rendering
  const renderCameraConfigPanels = (cameraConfigs: CameraConfig[]) => {
    // Check if we have camera configs
    if (cameraConfigs.length === 0) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          <p className="font-medium">No camera configurations</p>
          <p className="text-sm mt-1">This area has no camera configurations. Please add at least one camera configuration.</p>
        </div>
      );
    }
    
    // Check if we have any timestamps
    const hasAnyTimestamps = Object.values(cameraConfigTimestamps).some(timestamp => timestamp !== null);
    
    if (!hasAnyTimestamps) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          <p className="font-medium">No camera data available</p>
          <p className="text-sm mt-1">No timestamps found for cameras in this area. Try applying different settings.</p>
        </div>
      );
    }
    
    return cameraConfigs.map((config) => {
      // Get pre-calculated timestamp from state
      const configKey = `${config.camera_id}-${config.position.name}`;
      const cameraTimestamp = cameraConfigTimestamps[configKey];
      
      console.log(`📷 Rendering config ${configKey} with timestamp:`, cameraTimestamp);
      
      return (
        <div key={config.id} className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {(project.cameras.find(c => c.id === config.camera_id)?.name ?? "Unknown Camera")} ({config.position.name})
          </h3>
          
          {cameraTimestamp ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camera Image Panel */}
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-md font-medium mb-3">Camera View</h4>
                <ImageDisplay 
                  key={`image-${config.id}-${cameraTimestamp}`}
                  projectId={projectId}
                  cameraId={config.camera_id}
                  positionId={config.position.name}
                  timestamp={cameraTimestamp}
                />
              </div>
              
              {/* Heatmap Panel */}
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-md font-medium mb-3">Heatmap</h4>
                <HeatmapDisplay
                  key={`heatmap-${config.id}-${cameraTimestamp}`}
                  projectId={projectId}
                  cameraId={config.camera_id}
                  positionId={config.position.name}
                  timestamp={cameraTimestamp}
                />
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded">
              <p className="font-medium">No data available for this camera configuration</p>
              <p className="text-sm mt-1">There are no matching timestamps for this camera at the selected time.</p>
            </div>
          )}
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
        liveMode={liveMode}
        onLiveModeChange={handleLiveModeToggle}
        liveModeCountdown={liveModeCountdown}
      />
      
      {/* Show content based on dashboard state */}
      {dashboardState === 'loading' && (
        <div className="bg-white rounded-lg border p-8 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--tensora-medium)] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading prediction data...</p>
            </div>
          </div>
        </div>
      )}

      {/* No Data Available State */}
      {(dashboardState === 'empty' || dashboardState === 'error') && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-amber-800 mb-2">
              {dashboardState === 'empty' ? 'No Data Available' : 'Data Loading Error'}
            </h3>
            <p className="text-amber-700 mb-4 max-w-md mx-auto">
              {dataError || "No prediction data found for the selected time range and area."}
            </p>
            <div className="text-sm text-amber-600 space-y-1">
              <p>• Try expanding the time range (increase lookback hours)</p>
              <p>• Select a different date with available data</p>
              <p>• Ensure cameras in this area have generated predictions</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Available - Show all dashboard components */}
      {hasValidData && (
        <>
          {/* Stats Panel */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Statistics Overview</h2>
            <StatsPanel 
              current={stats.current}
              maximum={stats.maximum}
              average={stats.average}
              minimum={stats.minimum}
            />
          </div>
          
          {/* Crowd Graph */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Crowd Count</h2>
            <CrowdGraph 
              data={timeSeriesData} 
              isLoading={false}
              onPointClick={handleGraphPointClick}
              error={dataError}
            />
          </div>
          
          {/* Unified Density Display */}
          {area.camera_configs.length > 0 && area.camera_configs.every(cfg => cfg.enable_heatmap) && (
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Unified Density Map</h2>
              <UnifiedDensityDisplay
                projectId={projectId}
                areaId={area.id}
                timestamp={clickedTimestamp || formatUtcDateToIsoString(selectedDate)}
                cameraConfigs={area.camera_configs}
                cameraTimestamps={cameraTimestamps}
              />
            </div>
          )}
          
          {/* Camera Configuration Panels */}
          {renderCameraConfigPanels(area.camera_configs)}
        </>
      )}
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header with project name */}
      <div className="flex items-center mb-6">
          <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
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
        // Multiple areas - use tabs but only render selected area content
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
            setCameraConfigTimestamps({}); // Reset pre-calculated timestamps
            // Disable live mode when switching areas to avoid confusion
            setLiveMode(false);
            setLiveModeCountdown(30);
            // Reset processing state
            isProcessingRequest.current = false;
            currentRequestId.current = 0;
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
          
          {/* Only render the selected area's content */}
          {(() => {
            const selectedAreaData = project.areas.find(area => area.id === selectedArea);
            return selectedAreaData ? (
              <div className="mt-4">
                {renderAreaContent(selectedAreaData)}
              </div>
            ) : null;
          })()}
        </Tabs>
      )}
    </div>
  );
}

// Main protected dashboard page component with improved permission check
export default function DashboardPage() {
  const params = useParams();
  const projectId = params.project_id as string;
  const auth = useAuth();

  // Show loading if auth is still loading
  if (auth.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!auth.isAuthenticated) {
    return null; // Let middleware handle redirect
  }

  // FIXED: Improved permission check that waits for auth to be ready
  const canViewDashboard = () => {
    // Wait for auth to be fully loaded
    if (auth.isLoading || !auth.user || !projectId) {
      return false;
    }
    
    // Check permissions only when auth is ready
    return auth.permissions.canViewDashboard(projectId);
  };

  // If permission check fails, show access denied
  if (!canViewDashboard()) {
    return <DashboardAccessDenied projectId={projectId} />;
  }

  // Permission check passed, render dashboard
  return <DashboardPageContent />;
}