/**
 * Type definitions for project entities.
 */

export type Edge = [number, number];

export interface MaskingConfig {
  edges: Edge[];
}

export interface CameraConfig {
  camera_id: string;
  position: string;
  enable_heatmap: boolean;
  enable_interpolation: boolean;
  enable_masking: boolean;
  masking_config?: MaskingConfig;
}

export interface Camera {
  id: string;
  name: string;
  resolution: [number, number];
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