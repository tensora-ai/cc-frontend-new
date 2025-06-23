 import { Project, ProjectCreate, CameraCreate, CameraUpdate, AreaCreate, AreaUpdate, CameraConfigCreate, CameraConfigUpdate } from "@/models/project";
import { AggregateTimeSeriesRequest, AggregateTimeSeriesResponse } from "@/models/dashboard";
import { LoginRequest, LoginResponse, User } from "@/models/auth";
import { authenticatedFetch, publicFetch, getApiUrl } from "@/lib/api-config";

/**
 * Enhanced API client with JWT authentication support
 */
class ApiClient {
  // Authentication Methods

  /**
   * Login user and get access token
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await publicFetch(getApiUrl('auth/login'), {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Login failed');
    }

    return await response.json();
  }

  /**
   * Logout user (optional backend call)
   */
  async logout(): Promise<void> {
    try {
      await publicFetch(getApiUrl('auth/logout'), {
        method: 'POST',
      });
    } catch (error) {
      // Ignore logout errors - we'll clear local storage anyway
      console.log('Logout endpoint error (ignored):', error);
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    const response = await authenticatedFetch(getApiUrl('auth/me'), {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch user information');
    }

    return await response.json();
  }

  // Project Methods

  /**
   * Fetch all projects (filtered by user access automatically by backend)
   */
  async getProjects(): Promise<Project[]> {
    const response = await authenticatedFetch(getApiUrl('projects'), {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch projects');
    }

    const data = await response.json();
    return data.projects;
  }

  /**
   * Fetch a project by ID (with access control)
   */
  async getProject(projectId: string): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}`), {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to access this project');
      }
      
      throw new Error(error.detail || 'Failed to fetch project');
    }

    return await response.json();
  }

  /**
   * Create a new project (Super admin only)
   */
  async createProject(project: ProjectCreate): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl('projects'), {
      method: 'POST',
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to create projects');
      }
      
      throw new Error(error.detail || 'Failed to create project');
    }

    return await response.json();
  }

  /**
   * Delete a project (Super admin only)
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to delete projects');
      }
      
      throw new Error(error.detail || 'Failed to delete project');
    }

    return true;
  }

  // Camera Methods

  /**
   * Add a camera to a project (requires project management access)
   */
  async addCamera(projectId: string, camera: CameraCreate): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}/cameras`), {
      method: 'POST',
      body: JSON.stringify(camera),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to manage cameras in this project');
      }
      
      throw new Error(error.detail || 'Failed to add camera');
    }

    return await response.json();
  }

  /**
   * Update a camera (requires project management access)
   */
  async updateCamera(projectId: string, cameraId: string, camera: CameraUpdate): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}/cameras/${cameraId}`), {
      method: 'PUT',
      body: JSON.stringify(camera),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to update cameras in this project');
      }
      
      throw new Error(error.detail || 'Failed to update camera');
    }

    return await response.json();
  }

  /**
   * Delete a camera (requires project management access)
   */
  async deleteCamera(projectId: string, cameraId: string): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}/cameras/${cameraId}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to delete cameras in this project');
      }
      
      throw new Error(error.detail || 'Failed to delete camera');
    }

    return await response.json();
  }

  // Area Methods

  /**
   * Add an area to a project (requires project management access)
   */
  async addArea(projectId: string, area: AreaCreate): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}/areas`), {
      method: 'POST',
      body: JSON.stringify(area),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to manage areas in this project');
      }
      
      throw new Error(error.detail || 'Failed to add area');
    }

    return await response.json();
  }

  /**
   * Update an area (requires project management access)
   */
  async updateArea(projectId: string, areaId: string, area: AreaUpdate): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}/areas/${areaId}`), {
      method: 'PUT',
      body: JSON.stringify(area),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to update areas in this project');
      }
      
      throw new Error(error.detail || 'Failed to update area');
    }

    return await response.json();
  }

  /**
   * Delete an area (requires project management access)
   */
  async deleteArea(projectId: string, areaId: string): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}/areas/${areaId}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to delete areas in this project');
      }
      
      throw new Error(error.detail || 'Failed to delete area');
    }

    return await response.json();
  }

  // Camera Configuration Methods

  /**
   * Add a camera configuration to an area (requires project management access)
   */
  async addCameraConfig(projectId: string, areaId: string, config: CameraConfigCreate): Promise<Project> {
    const response = await authenticatedFetch(getApiUrl(`projects/${projectId}/areas/${areaId}/camera-configs`), {
      method: 'POST',
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to manage camera configurations in this project');
      }
      
      throw new Error(error.detail || 'Failed to add camera configuration');
    }

    return await response.json();
  }

  /**
   * Update a camera configuration (requires project management access)
   */
  async updateCameraConfig(
    projectId: string,
    areaId: string,
    configId: string,
    config: CameraConfigUpdate
  ): Promise<Project> {
    const response = await authenticatedFetch(
      getApiUrl(`projects/${projectId}/areas/${areaId}/camera-configs/${configId}`),
      {
        method: 'PUT',
        body: JSON.stringify(config),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to update camera configurations in this project');
      }
      
      throw new Error(error.detail || 'Failed to update camera configuration');
    }

    return await response.json();
  }

  /**
   * Delete a camera configuration (requires project management access)
   */
  async deleteCameraConfig(
    projectId: string,
    areaId: string,
    configId: string
  ): Promise<Project> {
    const response = await authenticatedFetch(
      getApiUrl(`projects/${projectId}/areas/${areaId}/camera-configs/${configId}`),
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to delete camera configurations in this project');
      }
      
      throw new Error(error.detail || 'Failed to delete camera configuration');
    }

    return await response.json();
  }

  // Predictions Methods

  /**
   * Aggregate time series predictions (requires dashboard access)
   */
  async aggregatePredictions(
    projectId: string, 
    areaId: string, 
    data: AggregateTimeSeriesRequest
  ): Promise<AggregateTimeSeriesResponse> {
    const response = await authenticatedFetch(
      getApiUrl(`projects/${projectId}/areas/${areaId}/predictions/aggregate`), 
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('You do not have permission to access dashboard data for this project');
      }
      
      throw new Error(error.detail || 'Failed to aggregate predictions');
    }

    return await response.json();
  }

  /**
   * Get direct backend URL for image blobs with authentication
   */
  getImageBlobUrl(blobName: string): string {
    return getApiUrl(`blobs/images/${blobName}`);
  }

  /**
   * Get direct backend URL for prediction blobs with authentication  
   */
  getPredictionBlobUrl(blobName: string): string {
    return getApiUrl(`blobs/predictions/${blobName}`);
  }

  /**
   * Fetch image blob directly from backend with authentication
   */
  async fetchImageBlob(blobName: string): Promise<Blob> {
    const response = await authenticatedFetch(this.getImageBlobUrl(blobName), {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Image not found');
      }
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    return await response.blob();
  }

  /**
   * Fetch prediction blob directly from backend with authentication
   */
  async fetchPredictionBlob(blobName: string): Promise<Blob> {
    const response = await authenticatedFetch(this.getPredictionBlobUrl(blobName), {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Prediction data not found');
      }
      throw new Error(`Failed to fetch prediction data: ${response.statusText}`);
    }

    return await response.blob();
  }

  /**
   * Fetch prediction JSON directly from backend with authentication
   */
  async fetchPredictionJson(blobName: string): Promise<any> {
    const response = await authenticatedFetch(this.getPredictionBlobUrl(blobName), {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Prediction data not found');
      }
      throw new Error(`Failed to fetch prediction data: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();