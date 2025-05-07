import { Project } from "@/models/project";

/**
 * Sample projects data for frontend development
 * This can be used as placeholder data while developing the frontend
 */
export const sampleProjects: Project[] = [
  // Project 1: EventCORE Demo
  {
    id: "eventcore-demo",
    name: "EventCORE Demo",
    cameras: [
      {
        id: "test_camera",
        name: "Test Camera",
        resolution: [2688, 1512]
      },
      {
        id: "test_camera_2",
        name: "Test Camera 2",
        resolution: [1920, 1080]
      }
    ],
    areas: [
      {
        id: "test_area",
        name: "Test Area",
        camera_configs: [
          {
            camera_id: "test_camera",
            position: "left",
            enable_heatmap: false,
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [0, 0],
                [0, 1511],
                [2687, 1511],
                [2687, 0]
              ]
            }
          },
          {
            camera_id: "test_camera",
            position: "right",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: false
          }
        ]
      },
      {
        id: "test_area_2",
        name: "Test Area 2",
        camera_configs: [
          {
            camera_id: "test_camera",
            position: "left",
            enable_heatmap: false,
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [0, 0],
                [0, 1511],
                [2687, 1511],
                [2687, 0]
              ]
            }
          },
          {
            camera_id: "test_camera_2",
            position: "standard",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: false
          }
        ]
      }
    ]
  },

  // Project 2: Exhibition Hall
  {
    id: "exhibition-hall",
    name: "Exhibition Hall",
    cameras: [
      {
        id: "entrance_camera",
        name: "Entrance Camera",
        resolution: [3840, 2160]
      },
      {
        id: "main_hall_camera",
        name: "Main Hall Camera",
        resolution: [1920, 1080]
      },
      {
        id: "exit_camera",
        name: "Exit Camera",
        resolution: [2560, 1440]
      }
    ],
    areas: [
      {
        id: "entrance_area",
        name: "Entrance Area",
        camera_configs: [
          {
            camera_id: "entrance_camera",
            position: "ceiling",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [100, 100],
                [100, 2000],
                [3700, 2000],
                [3700, 100]
              ]
            }
          }
        ]
      },
      {
        id: "main_hall",
        name: "Main Hall",
        camera_configs: [
          {
            camera_id: "main_hall_camera",
            position: "wall",
            enable_heatmap: true,
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [50, 50],
                [50, 1000],
                [1870, 1000],
                [1870, 50]
              ]
            }
          }
        ]
      },
      {
        id: "exit_area",
        name: "Exit Area",
        camera_configs: [
          {
            camera_id: "exit_camera",
            position: "ceiling",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: false
          }
        ]
      }
    ]
  },

  // Project 3: Music Festival
  {
    id: "music-festival",
    name: "Music Festival 2025",
    cameras: [
      {
        id: "main_stage_camera_1",
        name: "Main Stage Camera 1",
        resolution: [3840, 2160]
      },
      {
        id: "main_stage_camera_2",
        name: "Main Stage Camera 2",
        resolution: [3840, 2160]
      },
      {
        id: "second_stage_camera",
        name: "Second Stage Camera",
        resolution: [2560, 1440]
      },
      {
        id: "entrance_camera",
        name: "Entrance Camera",
        resolution: [1920, 1080]
      }
    ],
    areas: [
      {
        id: "main_stage",
        name: "Main Stage",
        camera_configs: [
          {
            camera_id: "main_stage_camera_1",
            position: "left",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [200, 200],
                [200, 1900],
                [3600, 1900],
                [3600, 200]
              ]
            }
          },
          {
            camera_id: "main_stage_camera_2",
            position: "right",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [200, 200],
                [200, 1900],
                [3600, 1900],
                [3600, 200]
              ]
            }
          }
        ]
      },
      {
        id: "second_stage",
        name: "Second Stage",
        camera_configs: [
          {
            camera_id: "second_stage_camera",
            position: "center",
            enable_heatmap: true,
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [100, 100],
                [100, 1300],
                [2400, 1300],
                [2400, 100]
              ]
            }
          }
        ]
      },
      {
        id: "entrance",
        name: "Festival Entrance",
        camera_configs: [
          {
            camera_id: "entrance_camera",
            position: "overhead",
            enable_heatmap: false,
            enable_interpolation: false,
            enable_masking: false
          }
        ]
      }
    ]
  },

  // Project 4: Shopping Mall
  {
    id: "shopping-mall",
    name: "City Center Mall",
    cameras: [
      {
        id: "food_court_camera",
        name: "Food Court Camera",
        resolution: [1920, 1080]
      },
      {
        id: "main_entrance_camera",
        name: "Main Entrance Camera",
        resolution: [2560, 1440]
      },
      {
        id: "north_wing_camera",
        name: "North Wing Camera",
        resolution: [1920, 1080]
      },
      {
        id: "south_wing_camera",
        name: "South Wing Camera",
        resolution: [1920, 1080]
      }
    ],
    areas: [
      {
        id: "food_court",
        name: "Food Court",
        camera_configs: [
          {
            camera_id: "food_court_camera",
            position: "ceiling",
            enable_heatmap: true,
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [50, 50],
                [50, 1030],
                [1870, 1030],
                [1870, 50]
              ]
            }
          }
        ]
      },
      {
        id: "main_entrance",
        name: "Main Entrance",
        camera_configs: [
          {
            camera_id: "main_entrance_camera",
            position: "wall",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: false
          }
        ]
      },
      {
        id: "north_wing",
        name: "North Wing",
        camera_configs: [
          {
            camera_id: "north_wing_camera",
            position: "ceiling",
            enable_heatmap: false,
            enable_interpolation: false,
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
      },
      {
        id: "south_wing",
        name: "South Wing",
        camera_configs: [
          {
            camera_id: "south_wing_camera",
            position: "ceiling",
            enable_heatmap: false,
            enable_interpolation: false,
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
  },
  
  // Project 5: Train Station
  {
    id: "central-station",
    name: "Central Train Station",
    cameras: [
      {
        id: "platform_1_camera",
        name: "Platform 1 Camera",
        resolution: [2560, 1440]
      },
      {
        id: "platform_2_camera",
        name: "Platform 2 Camera",
        resolution: [2560, 1440]
      },
      {
        id: "main_hall_camera",
        name: "Main Hall Camera",
        resolution: [3840, 2160]
      },
      {
        id: "ticket_area_camera",
        name: "Ticket Area Camera",
        resolution: [1920, 1080]
      },
      {
        id: "east_entrance_camera",
        name: "East Entrance Camera",
        resolution: [1920, 1080]
      }
    ],
    areas: [
      {
        id: "platform_1",
        name: "Platform 1",
        camera_configs: [
          {
            camera_id: "platform_1_camera",
            position: "end",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [200, 200],
                [200, 1240],
                [2360, 1240],
                [2360, 200]
              ]
            }
          }
        ]
      },
      {
        id: "platform_2",
        name: "Platform 2",
        camera_configs: [
          {
            camera_id: "platform_2_camera",
            position: "end",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: true,
            masking_config: {
              edges: [
                [200, 200],
                [200, 1240],
                [2360, 1240],
                [2360, 200]
              ]
            }
          }
        ]
      },
      {
        id: "main_hall",
        name: "Main Hall",
        camera_configs: [
          {
            camera_id: "main_hall_camera",
            position: "ceiling",
            enable_heatmap: true,
            enable_interpolation: false,
            enable_masking: true,
            masking_config: {
              edges: [
                [400, 400],
                [400, 1800],
                [3400, 1800],
                [3400, 400]
              ]
            }
          }
        ]
      },
      {
        id: "ticket_area",
        name: "Ticket Area",
        camera_configs: [
          {
            camera_id: "ticket_area_camera",
            position: "wall",
            enable_heatmap: false,
            enable_interpolation: false,
            enable_masking: false
          }
        ]
      },
      {
        id: "east_entrance",
        name: "East Entrance",
        camera_configs: [
          {
            camera_id: "east_entrance_camera",
            position: "ceiling",
            enable_heatmap: true,
            enable_interpolation: true,
            enable_masking: false
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