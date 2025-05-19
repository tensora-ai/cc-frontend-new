/**
 * Type definitions for dashboard data
 */

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface AggregateTimeSeriesRequest {
  project: string;
  area: string;
  end_date: string;
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
}

export interface CameraImage {
  url: string;
  timestamp: string;
  camera_id: string;
  position: string;
}