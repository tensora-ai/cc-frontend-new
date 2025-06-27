/**
 * Type definitions for dashboard data
 */

export interface TimeSeriesPoint {
  timestamp: string;  // UTC ISO format
  value: number;
}

export interface AggregateTimeSeriesRequest {
  end_date: string;  // UTC ISO format
  lookback_hours: number;
  half_moving_avg_size: number;
}

export interface CameraTimestamp {
  camera_id: string;
  position: string;
  timestamp: string;  // UTC ISO format
}

export interface AggregateTimeSeriesResponse {
  time_series: TimeSeriesPoint[];
  camera_timestamps: CameraTimestamp[];
}

export interface DensityResponse {
  data: number[][];  // 2D array of density values
  timestamp: string;  // UTC ISO format
}

// Simple, predictable state machine
export type DashboardState = 
  | { type: 'IDLE' }
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; data: DashboardData }
  | { type: 'ERROR'; error: string };

export type DashboardData = {
  timeSeries: TimeSeriesPoint[];
  cameraTimestamps: CameraTimestamp[];
  selectedTimestamp: string; // Always have a selected timestamp
};

export type DashboardSettings = {
  date: Date;
  lookbackHours: number;
};

export type LiveModeState = {
  enabled: boolean;
  countdown: number;
};
