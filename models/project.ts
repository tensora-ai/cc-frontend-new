/**
 * Type definitions for project entities.
 */

export interface Position {
  name: string;
  center_ground_plane?: [number, number];
  focal_length?: number;
}

export type Edge = [number, number];

export interface MaskingConfig {
  edges: Edge[];
}

export type HeatmapConfig = [number, number, number, number];

export interface CameraConfig {
  id: string;
  name: string;
  camera_id: string;
  position: Position;
  enable_heatmap: boolean;
  heatmap_config?: HeatmapConfig;
  enable_interpolation: boolean;
  enable_masking: boolean;
  masking_config?: MaskingConfig;
}

export enum CountingModel {
  MODEL_2020_QNRF = "model_2020_qnrf.pth",
  MODEL_2020_NWPU = "model_2020_nwpu.pth",
  MODEL_20240725 = "model_20240725.pth",
  MODEL_20250625 = "model_20250625.pth",
}

export interface TimeAtDay {
  hour: number;
  minute: number;
  second: number;
}

export interface ModelSchedule {
  id: string;
  name: string;
  start: TimeAtDay;
  end: TimeAtDay;
  model: CountingModel;
}

export interface Camera {
  id: string;
  name: string;
  resolution: [number, number];
  sensor_size?: [number, number];
  coordinates_3d?: [number, number, number];

  default_model?: CountingModel;
  model_schedules?: ModelSchedule[];
}

export interface Area {
  id: string;
  name: string;
  camera_configs: CameraConfig[];
}

export interface Project {
  id: string;
  name: string;
  cameras: Camera[];
  areas: Area[];
}

// Request / Response Models
export interface ProjectCreate {
  id: string;
  name: string;
}

export interface ProjectList {
  projects: Project[];
}

export interface CameraCreate {
  id: string;
  name: string;
  resolution: [number, number];
  sensor_size?: [number, number];
  coordinates_3d?: [number, number, number];
  default_model?: CountingModel;
  model_schedules?: ModelSchedule[];
}

export interface CameraUpdate {
  name: string;
  resolution: [number, number];
  sensor_size?: [number, number];
  coordinates_3d?: [number, number, number];
  default_model?: CountingModel;
  model_schedules?: ModelSchedule[];
}

export interface AreaCreate {
  id: string;
  name: string;
}

export interface AreaUpdate {
  name: string;
}

export interface CameraConfigCreate {
  id: string;
  name: string;
  camera_id: string;
  position: Position;
  enable_heatmap: boolean;
  heatmap_config?: HeatmapConfig;
  enable_interpolation: boolean;
  enable_masking: boolean;
  masking_config?: MaskingConfig;
}

export interface CameraConfigUpdate {
  name: string;
  camera_id: string;
  position: Position;
  enable_heatmap: boolean;
  heatmap_config?: HeatmapConfig;
  enable_interpolation: boolean;
  enable_masking: boolean;
  masking_config?: MaskingConfig;
}