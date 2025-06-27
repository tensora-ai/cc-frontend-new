"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import { 
  getLocalNow, 
  formatUtcDateToIsoString 
} from "@/lib/datetime-utils";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

// Import types
import { Project } from "@/models/project";
import { TimeSeriesPoint, CameraTimestamp, DashboardState, DashboardSettings, LiveModeState, DashboardData } from "@/models/dashboard";

// Import UI components (we'll reuse these)
import { ControlPanel } from "@/components/dashboard/control-panel";
import { StatsPanel } from "@/components/dashboard/stats-panel";
import { CrowdGraph } from "@/components/dashboard/crowd-graph";
import { ImageDisplay } from "@/components/dashboard/image-display";
import { HeatmapDisplay } from "@/components/dashboard/heatmap-display";
import { UnifiedDensityDisplay } from "@/components/dashboard/unified-density-display";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pure helper functions (no side effects)
const findNearestTimestamp = (
  cameraId: string,
  position: string,
  targetTimestamp: string,
  availableTimestamps: CameraTimestamp[]
): string | null => {
  const relevantTimestamps = availableTimestamps.filter(
    ct => ct.camera_id === cameraId && ct.position === position
  );

  if (relevantTimestamps.length === 0) return null;

  // Parse timestamps and find closest
  const targetTime = new Date(targetTimestamp.endsWith('Z') ? targetTimestamp : targetTimestamp + 'Z').getTime();
  
  let closest = relevantTimestamps[0];
  let smallestDiff = Math.abs(new Date(closest.timestamp + 'Z').getTime() - targetTime);

  for (const ct of relevantTimestamps) {
    const diff = Math.abs(new Date(ct.timestamp + 'Z').getTime() - targetTime);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = ct;
    }
  }

  return closest.timestamp;
};

const calculateStats = (timeSeries: TimeSeriesPoint[]) => {
  if (timeSeries.length === 0) {
    return { current: 0, maximum: 0, average: 0, minimum: 0 };
  }

  const values = timeSeries.map(point => point.value);
  return {
    current: values[values.length - 1],
    maximum: Math.max(...values),
    average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    minimum: Math.min(...values)
  };
};

// Main protected dashboard component with proper auth
function DashboardPageContent() {
  const params = useParams();
  const auth = useAuth();
  const projectId = params.project_id as string;

  // Core state - single sources of truth
  const [project, setProject] = useState<Project | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [dashboardState, setDashboardState] = useState<DashboardState>({ type: 'IDLE' });
  const [settings, setSettings] = useState<DashboardSettings>({
    date: getLocalNow(),
    lookbackHours: 3
  });
  const [liveMode, setLiveMode] = useState<LiveModeState>({
    enabled: false,
    countdown: 30
  });

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load project data once
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await apiClient.getProject(projectId);
        setProject(projectData);
        if (projectData.areas.length > 0) {
          setSelectedArea(projectData.areas[0].id);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        setDashboardState({ 
          type: 'ERROR', 
          error: error instanceof Error ? error.message : 'Failed to load project' 
        });
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Single data fetching function - no race conditions
  const fetchDashboardData = useCallback(async (
    projectId: string,
    areaId: string,
    settings: DashboardSettings
  ) => {
    console.log('🔄 Fetching dashboard data', { projectId, areaId, settings });
    
    setDashboardState({ type: 'LOADING' });

    try {
      const endDate = formatUtcDateToIsoString(settings.date);
      
      const response = await apiClient.aggregatePredictions(projectId, areaId, {
        end_date: endDate,
        lookback_hours: settings.lookbackHours,
        half_moving_avg_size: 0
      });

      if (!response.time_series || response.time_series.length === 0) {
        // Don't set error state for no data - handle this in UI instead
        const dashboardData: DashboardData = {
          timeSeries: [],
          cameraTimestamps: response.camera_timestamps || [],
          selectedTimestamp: ''
        };
        
        setDashboardState({ type: 'SUCCESS', data: dashboardData });
        return;
      }

      // Auto-select latest timestamp
      const latestTimestamp = response.time_series[response.time_series.length - 1].timestamp;

      const dashboardData: DashboardData = {
        timeSeries: response.time_series,
        cameraTimestamps: response.camera_timestamps || [],
        selectedTimestamp: latestTimestamp
      };

      setDashboardState({ type: 'SUCCESS', data: dashboardData });
      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      setDashboardState({ 
        type: 'ERROR', 
        error: error instanceof Error ? error.message : 'Failed to fetch data' 
      });
    }
  }, []);

  // Apply handler - simple and direct
  const handleApply = useCallback(() => {
    if (!projectId || !selectedArea) return;
    
    console.log('👆 Apply button clicked');
    fetchDashboardData(projectId, selectedArea, settings);
  }, [projectId, selectedArea, settings, fetchDashboardData]);

  // Live mode management - clean separation of concerns
  useEffect(() => {
    // Clear existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (!liveMode.enabled || !projectId || !selectedArea) {
      return;
    }

    console.log('🔴 Starting live mode');

    // Main refresh interval
    intervalRef.current = setInterval(() => {
      console.log('🔄 Live mode refresh');
      const currentTime = getLocalNow();
      setSettings(prev => ({ ...prev, date: currentTime }));
      fetchDashboardData(projectId, selectedArea, { 
        ...settings, 
        date: currentTime 
      });
      setLiveMode(prev => ({ ...prev, countdown: 30 }));
    }, 30000);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setLiveMode(prev => ({ 
        ...prev, 
        countdown: prev.countdown <= 1 ? 30 : prev.countdown - 1 
      }));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [liveMode.enabled, projectId, selectedArea, settings, fetchDashboardData]);

  // Graph point click handler
  const handleGraphPointClick = useCallback((timestamp: string) => {
    console.log('📊 Graph point clicked:', timestamp);
    
    if (dashboardState.type === 'SUCCESS') {
      setDashboardState({
        type: 'SUCCESS',
        data: {
          ...dashboardState.data,
          selectedTimestamp: timestamp
        }
      });
    }
  }, [dashboardState]);

  // Settings update handlers
  const handleDateChange = useCallback((newDate: Date) => {
    setSettings(prev => ({ ...prev, date: newDate }));
  }, []);

  const handleLookbackChange = useCallback((hours: number) => {
    setSettings(prev => ({ ...prev, lookbackHours: hours }));
  }, []);

  const handleReset = useCallback(() => {
    setSettings({
      date: getLocalNow(),
      lookbackHours: 3
    });
  }, []);

  const handleLiveModeToggle = useCallback((enabled: boolean) => {
    setLiveMode(prev => ({ ...prev, enabled }));
    
    if (enabled) {
      // Immediately refresh when starting live mode
      const currentTime = getLocalNow();
      setSettings(prev => ({ ...prev, date: currentTime }));
      if (projectId && selectedArea) {
        fetchDashboardData(projectId, selectedArea, { 
          ...settings, 
          date: currentTime 
        });
      }
    }
  }, [projectId, selectedArea, settings, fetchDashboardData]);

  // Area change handler
  const handleAreaChange = useCallback((newAreaId: string) => {
    setSelectedArea(newAreaId);
    setDashboardState({ type: 'IDLE' });
    setLiveMode({ enabled: false, countdown: 30 });
  }, []);

  // Check permissions before rendering dashboard
  if (!auth.permissions.canViewDashboard(projectId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Access Denied</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">You don't have permission to view this dashboard</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  // No areas configured
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

  const selectedAreaData = project.areas.find(a => a.id === selectedArea);
  const stats = dashboardState.type === 'SUCCESS' 
    ? calculateStats(dashboardState.data.timeSeries)
    : { current: 0, maximum: 0, average: 0, minimum: 0 };

  // Check if unified density should be shown
  const shouldShowUnifiedDensity = selectedAreaData && 
    selectedAreaData.camera_configs.length > 0 && 
    selectedAreaData.camera_configs.every(cfg => cfg.enable_heatmap);

  const hasValidData = dashboardState.type === 'SUCCESS' && dashboardState.data.timeSeries.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--tensora-dark)]">{project.name} Dashboard</h1>
      </div>

      {/* Area Selection */}
      {project.areas.length === 1 ? (
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[var(--tensora-dark)]">{project.areas[0].name}</h2>
        </div>
      ) : (
        <div className="flex gap-2 mb-4 flex-wrap">
          {project.areas.map(area => (
            <button
              key={area.id}
              onClick={() => handleAreaChange(area.id)}
              className={`px-4 py-2 rounded transition-colors ${
                area.id === selectedArea 
                  ? 'bg-[var(--tensora-dark)] text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      )}

      {/* Control Panel - Always visible */}
      <ControlPanel
        date={settings.date}
        onDateChange={handleDateChange}
        lookbackHours={settings.lookbackHours}
        onLookbackChange={handleLookbackChange}
        onReset={handleReset}
        onApply={handleApply}
        loading={dashboardState.type === 'LOADING'}
        showApplyButton={true}
        liveMode={liveMode.enabled}
        onLiveModeChange={handleLiveModeToggle}
        liveModeCountdown={liveMode.countdown}
      />

      {/* Handle different dashboard states */}
      {dashboardState.type === 'ERROR' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{dashboardState.error}</p>
            <button 
              onClick={handleApply}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {dashboardState.type === 'LOADING' && (
        <div className="bg-white rounded-lg border p-8 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--tensora-medium)] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      )}

      {dashboardState.type === 'IDLE' && (
        <div className="bg-gray-50 rounded-lg border p-8 shadow-sm text-center">
          <p className="text-gray-600 mb-4">Configure your settings and click "Apply" to load data</p>
          <button
            onClick={handleApply}
            disabled={!selectedArea}
            className="bg-[var(--tensora-dark)] text-white px-6 py-2 rounded hover:bg-[var(--tensora-medium)] disabled:opacity-50"
          >
            Load Dashboard Data
          </button>
        </div>
      )}

      {/* Success state - show data or no-data message */}
      {dashboardState.type === 'SUCCESS' && (
        <>
          {!hasValidData ? (
            /* No prediction data available */
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-8 shadow-sm">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium text-amber-800 mb-2">No Data Available</h3>
                <p className="text-amber-700 mb-4 max-w-md mx-auto">
                  No prediction data found for the selected time range and area.
                </p>
                <div className="text-sm text-amber-600 space-y-1">
                  <p>• Try expanding the time range (increase lookback hours)</p>
                  <p>• Select a different date with available data</p>
                  <p>• Ensure cameras in this area have generated predictions</p>
                </div>
              </div>
            </div>
          ) : (
            /* Valid data available */
            <>
              {/* Stats */}
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h2 className="text-lg font-medium mb-4">Statistics Overview</h2>
                <StatsPanel {...stats} />
              </div>

              {/* Graph */}
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h2 className="text-lg font-medium mb-4">Crowd Count</h2>
                <CrowdGraph
                  data={dashboardState.data.timeSeries}
                  isLoading={false}
                  onPointClick={handleGraphPointClick}
                />
              </div>

              {/* Unified Density Display */}
              {shouldShowUnifiedDensity && dashboardState.data.selectedTimestamp && (
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                  <h2 className="text-lg font-medium mb-4">Unified Density Map</h2>
                  <UnifiedDensityDisplay
                    projectId={projectId}
                    areaId={selectedArea}
                    timestamp={dashboardState.data.selectedTimestamp}
                    cameraConfigs={selectedAreaData.camera_configs}
                    cameraTimestamps={dashboardState.data.cameraTimestamps}
                  />
                </div>
              )}

              {/* Camera Data */}
              {selectedAreaData ? (
                selectedAreaData.camera_configs.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
                    <p className="font-medium">No camera configurations</p>
                    <p className="text-sm mt-1">This area has no camera configurations. Please add at least one camera configuration to view camera data.</p>
                  </div>
                ) : (
                  selectedAreaData.camera_configs.map(config => {
                    const nearestTimestamp = findNearestTimestamp(
                      config.camera_id,
                      config.position.name,
                      dashboardState.data.selectedTimestamp,
                      dashboardState.data.cameraTimestamps
                    );

                    return nearestTimestamp ? (
                      <div key={config.id} className="bg-white rounded-lg border shadow-sm p-4 mb-6">
                        <h3 className="text-lg font-medium mb-4">
                          {project.cameras.find(c => c.id === config.camera_id)?.name || config.camera_id} ({config.position.name})
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-lg border p-4">
                            <h4 className="text-md font-medium mb-3">Camera View</h4>
                            <ImageDisplay
                              projectId={projectId}
                              cameraId={config.camera_id}
                              positionId={config.position.name}
                              timestamp={nearestTimestamp}
                            />
                          </div>
                          
                          <div className="bg-white rounded-lg border p-4">
                            <h4 className="text-md font-medium mb-3">Heatmap</h4>
                            <HeatmapDisplay
                              projectId={projectId}
                              cameraId={config.camera_id}
                              positionId={config.position.name}
                              timestamp={nearestTimestamp}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={config.id} className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded">
                        <p className="font-medium">No data available for {config.camera_id} ({config.position.name})</p>
                        <p className="text-sm mt-1">No matching timestamps found for this camera at the selected time.</p>
                      </div>
                    );
                  })
                )
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}

// Main component with proper authentication protection
export default function DashboardPageRebuilt() {
  const params = useParams();
  const projectId = params.project_id as string;

  return (
    <ProtectedRoute
      projectId={projectId}
      requireProjectAccess={true}
    >
      <DashboardPageContent />
    </ProtectedRoute>
  );
}