/**
 * Type definitions for project entities.
 */

export interface Position {
  name: string;
  center_ground_plane: [number, number];
  focal_length: number;
}

export type Edge = [number, number];

export interface MaskingConfig {
  edges: Edge[];
}

export type HeatmapConfig = [number, number, number, number];

export interface CameraConfig {
  camera_id: string;
  position: Position;
  enable_heatmap: boolean;
  heatmap_config?: HeatmapConfig;
  enable_interpolation: boolean;
  enable_masking: boolean;
  masking_config?: MaskingConfig;
}

export interface Camera {
  id: string;
  name: string;
  resolution: [number, number];
  sensor_size: [number, number];
  coordinates_3d: [number, number, number];
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