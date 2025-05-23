/**
 * Type definitions for dashboard data
 */

export interface TimeSeriesPoint {
  timestamp: string;  // UTC ISO format
  value: number;
}

export interface TimeSeriesPointWithLocalTime {
  time: Date,
  count: number,
  timeFormatted: string,
  localTimeString: string
}

export interface AggregateTimeSeriesRequest {
  end_date: string;  // UTC ISO format
  lookback_hours: number;
  half_moving_avg_size: number;
}

export interface AggregateTimeSeriesResponse {
  time_series: TimeSeriesPoint[];
  source_ids: string[];
}

export interface DensityPoint {
  x: number;
  y: number;
  value: number;
}

export interface HeatmapData {
  points: DensityPoint[];
  dimensions: {
    width: number;
    height: number;
  };
  timestamp: string;  // UTC ISO format
}

export interface CameraImage {
  url: string;
  timestamp: string;  // UTC ISO format
  camera_id: string;
  position: string;
}

export interface DensityResponse {
  data: number[][];  // 2D array of density values
  timestamp: string;  // UTC ISO format
}