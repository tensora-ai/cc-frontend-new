import { Project, CountingModel } from "@/models/project";

/**
 * Sample projects data for frontend development
 * This can be used as placeholder data while developing the frontend
 */
export const sampleProjects: Project[] = [
  // Project 1: Wacken Open Air 2024
  {
    id: "woa24",
    name: "Wacken Open Air 2024",
    cameras: [
      {
        id: "faster_left",
        name: "Faster Stage Left Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [10, 16.7, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "faster_left_lightshow",
            name: "Evening Lightshow",
            start: { hour: 20, minute: 30, second: 0 },
            end: { hour: 0, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      },
      {
        id: "faster_right",
        name: "Faster Stage Right Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [50.2, 16.7, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "faster_right_lightshow",
            name: "Evening Lightshow",
            start: { hour: 20, minute: 30, second: 0 },
            end: { hour: 0, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      },
      {
        id: "harder_left",
        name: "Harder Stage Left Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [5, 16.7, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "harder_left_lightshow",
            name: "Evening Lightshow",
            start: { hour: 19, minute: 30, second: 0 },
            end: { hour: 0, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      },
      {
        id: "harder_right",
        name: "Harder Stage Right Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [45.2, 16.7, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "harder_right_lightshow",
            name: "Evening Lightshow",
            start: { hour: 19, minute: 30, second: 0 },
            end: { hour: 0, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      },
      {
        id: "louder_left",
        name: "Louder Stage Left Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [5, 13.3, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "louder_left_lightshow",
            name: "Evening Lightshow",
            start: { hour: 20, minute: 30, second: 0 },
            end: { hour: 22, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      },
      {
        id: "louder_right",
        name: "Louder Stage Right Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [40, 13.3, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "louder_right_lightshow",
            name: "Evening Lightshow",
            start: { hour: 20, minute: 30, second: 0 },
            end: { hour: 22, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      }
    ],
    areas: [
      {
        id: "faster",
        name: "Faster Stage",
        camera_configs: [
          {
            camera_id: "faster_left",
            position: {
              name: "standard",
              center_ground_plane: [19, 15],
              focal_length: 0.008
            },
            enable_heatmap: true,
            heatmap_config: [8, 5, 30, 30],
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [411, 2157],
                [2154, 2148],
                [2859, 1920],
                [2307, 894],
                [1824, 90],
                [555, 264]
              ]
            }
          },
          {
            camera_id: "faster_right",
            position: {
              name: "standard",
              center_ground_plane: [43, 15],
              focal_length: 0.0085
            },
            enable_heatmap: true,
            heatmap_config: [30, 5, 53, 30],
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [411, 2157],
                [2154, 2148],
                [2859, 1920],
                [2307, 894],
                [1824, 90],
                [555, 264]
              ]
            }
          }
        ]
      },
      {
        id: "harder",
        name: "Harder Stage",
        camera_configs: [
          {
            camera_id: "harder_left",
            position: {
              name: "standard",
              center_ground_plane: [17, 15.5],
              focal_length: 0.00815
            },
            enable_heatmap: true,
            heatmap_config: [2, 5, 26, 30],
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [1, 2157],
                [1422, 2154],
                [3426, 1413],
                [2523, 375],
                [1911, 60],
                [1, 426]
              ]
            }
          },
          {
            camera_id: "harder_right",
            position: {
              name: "standard",
              center_ground_plane: [37, 16],
              focal_length: 0.008
            },
            enable_heatmap: true,
            heatmap_config: [26, 5, 50, 30],
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [1206, 1947],
                [3591, 2136],
                [3420, 1],
                [2091, 1],
                [1605, 708]
              ]
            }
          }
        ]
      },
      {
        id: "louder",
        name: "Louder Stage",
        camera_configs: [
          {
            camera_id: "louder_left",
            position: {
              name: "standard",
              center_ground_plane: [10, 15],
              focal_length: 0.0077
            },
            enable_heatmap: true,
            heatmap_config: [0, 5, 22, 25],
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [2622, 177],
                [312, 150],
                [24, 267],
                [15, 2133],
                [3291, 2142],
                [3570, 1737]
              ]
            }
          },
          {
            camera_id: "louder_right",
            position: {
              name: "standard",
              center_ground_plane: [30, 13],
              focal_length: 0.0099
            },
            enable_heatmap: true,
            heatmap_config: [22, 5, 39, 25],
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [201, 1389],
                [1743, 18],
                [3576, 21],
                [3582, 2145],
                [1563, 2073]
              ]
            }
          }
        ]
      }
    ]
  },
  
  // Project 2: Summer Festival 2025 (Based on similar structure but with modified values)
  {
    id: "summer-festival-2025",
    name: "Summer Festival 2025",
    cameras: [
      {
        id: "main_stage_left",
        name: "Main Stage Left Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [12, 18.5, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "main_stage_left_afternoon",
            name: "Afternoon Shows",
            start: { hour: 14, minute: 0, second: 0 },
            end: { hour: 19, minute: 0, second: 0 },
            model: CountingModel.Model0725
          },
          {
            id: "main_stage_left_evening",
            name: "Evening Lightshow",
            start: { hour: 19, minute: 0, second: 0 },
            end: { hour: 0, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      },
      {
        id: "main_stage_right",
        name: "Main Stage Right Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [48, 18.5, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "main_stage_right_evening",
            name: "Evening Lightshow",
            start: { hour: 19, minute: 0, second: 0 },
            end: { hour: 0, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      },
      {
        id: "dance_tent_cam",
        name: "Dance Tent Camera",
        resolution: [3840, 2160],
        sensor_size: [0.01143, 0.00643],
        coordinates_3d: [25, 12.5, 0],
        default_model: CountingModel.Model0725,
        model_schedules: [
          {
            id: "dance_tent_night",
            name: "Night Mode",
            start: { hour: 21, minute: 0, second: 0 },
            end: { hour: 4, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU
          }
        ]
      },
      {
        id: "entrance_cam",
        name: "Main Entrance Camera",
        resolution: [1920, 1080],
        sensor_size: [0.00571, 0.00321],
        coordinates_3d: [0, 0, 5],
        default_model: CountingModel.Model0725,
        model_schedules: []
      }
    ],
    areas: [
      {
        id: "main_stage",
        name: "Main Stage",
        camera_configs: [
          {
            camera_id: "main_stage_left",
            position: {
              name: "standard",
              center_ground_plane: [20, 16],
              focal_length: 0.0082
            },
            enable_heatmap: true,
            heatmap_config: [10, 7, 35, 28],
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [400, 2100],
                [2200, 2120],
                [2900, 1900],
                [2300, 800],
                [1800, 100],
                [550, 250]
              ]
            }
          },
          {
            camera_id: "main_stage_right",
            position: {
              name: "standard",
              center_ground_plane: [45, 16],
              focal_length: 0.0085
            },
            enable_heatmap: true,
            heatmap_config: [28, 7, 50, 28],
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [420, 2150],
                [2100, 2140],
                [2850, 1900],
                [2320, 880],
                [1830, 100],
                [560, 260]
              ]
            }
          }
        ]
      },
      {
        id: "dance_tent",
        name: "Dance Tent",
        camera_configs: [
          {
            camera_id: "dance_tent_cam",
            position: {
              name: "ceiling",
              center_ground_plane: [25, 15],
              focal_length: 0.0075
            },
            enable_heatmap: true,
            heatmap_config: [5, 5, 45, 35],
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [100, 100],
                [100, 2050],
                [3740, 2050],
                [3740, 100]
              ]
            }
          }
        ]
      },
      {
        id: "entrance",
        name: "Main Entrance",
        camera_configs: [
          {
            camera_id: "entrance_cam",
            position: {
              name: "overhead",
              center_ground_plane: [960, 540],
              focal_length: 0.006
            },
            enable_heatmap: false,
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [100, 100],
                [100, 980],
                [1820, 980],
                [1820, 100]
              ]
            }
          }
        ]
      }
    ]
  }
];

/**
 * Utility function to get a project by ID
 */
export function getProjectById(id: string): Project | undefined {
  return sampleProjects.find(project => project.id === id);
}