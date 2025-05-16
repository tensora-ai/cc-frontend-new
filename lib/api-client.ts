import { Project, ProjectCreate, CameraCreate, CameraUpdate, AreaCreate, AreaUpdate } from "@/models/project";

/**
 * API client for interacting with the backend via the Next.js API routes
 */
class ApiClient {
  // Project Methods
  
  /**
   * Fetch all projects
   */
  async getProjects(): Promise<Project[]> {
    const response = await fetch('/api/projects', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch projects');
    }
    
    const data = await response.json();
    return data.projects;
  }
  
  /**
   * Fetch a project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch project');
    }
    
    return await response.json();
  }
  
  /**
   * Create a new project
   */
  async createProject(project: ProjectCreate): Promise<Project> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }
    
    return await response.json();
  }
  
  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
    
    return true;
  }
  
  // Camera Methods
  
  /**
   * Add a camera to a project
   */
  async addCamera(projectId: string, camera: CameraCreate): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(camera),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add camera');
    }
    
    return await response.json();
  }
  
  /**
   * Update a camera
   */
  async updateCamera(projectId: string, cameraId: string, camera: CameraUpdate): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}/cameras/${cameraId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(camera),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update camera');
    }
    
    return await response.json();
  }
  
  /**
   * Delete a camera
   */
  async deleteCamera(projectId: string, cameraId: string): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}/cameras/${cameraId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete camera');
    }
    
    return await response.json();
  }
  
  // Area Methods
  
  /**
   * Add an area to a project
   */
  async addArea(projectId: string, area: AreaCreate): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}/areas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(area),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add area');
    }
    
    return await response.json();
  }
  
  /**
   * Update an area
   */
  async updateArea(projectId: string, areaId: string, area: AreaUpdate): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}/areas/${areaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(area),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update area');
    }
    
    return await response.json();
  }
  
  /**
   * Delete an area
   */
  async deleteArea(projectId: string, areaId: string): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}/areas/${areaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete area');
    }
    
    return await response.json();
  }
  
  // Camera Configuration Methods
  
  /**
   * Add a camera configuration to an area
   */
  async addCameraConfig(projectId: string, areaId: string, config: any): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}/areas/${areaId}/camera-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add camera configuration');
    }
    
    return await response.json();
  }
  
  /**
   * Update a camera configuration
   */
  async updateCameraConfig(
    projectId: string, 
    areaId: string, 
    cameraId: string, 
    position: string, 
    config: any
  ): Promise<Project> {
    const response = await fetch(
      `/api/projects/${projectId}/areas/${areaId}/camera-configs/${cameraId}/${position}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update camera configuration');
    }
    
    return await response.json();
  }
  
  /**
   * Delete a camera configuration
   */
  async deleteCameraConfig(
    projectId: string, 
    areaId: string, 
    cameraId: string, 
    position: string
  ): Promise<Project> {
    const response = await fetch(
      `/api/projects/${projectId}/areas/${areaId}/camera-configs/${cameraId}/${position}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete camera configuration');
    }
    
    return await response.json();
  }
  
  // Predictions Methods
  
  /**
   * Aggregate time series predictions
   */
  async aggregatePredictions(data: any): Promise<any> {
    const response = await fetch('/api/predictions/aggregate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to aggregate predictions');
    }
    
    return await response.json();
  }
  
  // Images Methods
  
  /**
   * Get image URL
   */
  getImageUrl(imageName: string): string {
    return `/api/images/${imageName}`;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();