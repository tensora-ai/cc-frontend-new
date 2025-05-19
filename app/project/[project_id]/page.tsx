"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Camera, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Project, Edge, CountingModel, ModelSchedule, Position, CameraConfig, CameraConfigCreate, CameraConfigUpdate } from "@/models/project";
import { apiClient } from "@/lib/api-client";

// Import our custom components
import { DashboardButton } from "@/components/project/dashboard-button";
import { CameraCard } from "@/components/camera/camera-card";
import { AreaCard } from "@/components/area/area-card";
import { SectionHeader } from "@/components/project/section-header";
import { AddButton } from "@/components/project/add-button";
import { AreaDetailCard } from "@/components/area/area-detail-card";

// Import camera dialog components
import { AddCameraDialog } from "@/components/camera/add-camera-dialog";
import { EditCameraDialog } from "@/components/camera/edit-camera-dialog";
import { DeleteCameraDialog } from "@/components/camera/delete-camera-dialog";

// Import area dialog components
import { AddAreaDialog } from "@/components/area/add-area-dialog";
import { EditAreaDialog } from "@/components/area/edit-area-dialog";
import { DeleteAreaDialog } from "@/components/area/delete-area-dialog";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  // Project data state
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Area detail view state
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Camera management dialog states
  const [addCameraDialogOpen, setAddCameraDialogOpen] = useState(false);
  const [editCameraDialogOpen, setEditCameraDialogOpen] = useState(false);
  const [deleteCameraDialogOpen, setDeleteCameraDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<{
    id: string;
    name: string;
    resolution: [number, number];
  } | null>(null);

  // Area management dialog states
  const [addAreaDialogOpen, setAddAreaDialogOpen] = useState(false);
  const [editAreaDialogOpen, setEditAreaDialogOpen] = useState(false);
  const [deleteAreaDialogOpen, setDeleteAreaDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<{
    id: string;
    name: string;
    camera_configs: CameraConfig[];
  } | null>(null);

  // Load project data
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        
        // Call our API client to fetch the project
        const projectData = await apiClient.getProject(projectId);
        
        if (projectData) {
          setProject(projectData);
        } else {
          setError("Project not found");
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch project details:", err);
        setError("Failed to load project details. Please try again later.");
        setLoading(false);
      }
    }

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Camera management functions

  // Function to add a new camera
  const handleAddCamera = async (
    id: string,
    name: string,
    resolution: [number, number],
    defaultModel: CountingModel,
    sensorSize?: [number, number],
    coordinates3d?: [number, number, number],
    modelSchedules?: ModelSchedule[]
  ) => {
    if (!project) return;

    try {
      // Create new camera object
      const newCamera = {
        id,
        name,
        resolution,
        sensor_size: sensorSize,
        coordinates_3d: coordinates3d,
        default_model: defaultModel,
        model_schedules: modelSchedules
      };

      // Call API client to add camera
      const updatedProject = await apiClient.addCamera(projectId, newCamera);
      
      // Update local state
      setProject(updatedProject);
      
      // Close dialog
      setAddCameraDialogOpen(false);
    } catch (err) {
      console.error("Failed to add camera:", err);
      setError("Failed to add camera. Please try again later.");
    }
  };


  // Function to update an existing camera
  const handleUpdateCamera = async (
    id: string, 
    name: string, 
    resolution: [number, number],
    defaultModel: CountingModel,
    sensorSize?: [number, number],
    coordinates3d?: [number, number, number],
    modelSchedules?: ModelSchedule[]
  ) => {
    if (!project) return;
    
    try {
      // Create camera update object
      const updatedCamera = {
        name, 
        resolution,
        sensor_size: sensorSize,
        coordinates_3d: coordinates3d, 
        default_model: defaultModel, 
        model_schedules: modelSchedules 
      };
      
      // Call API client to update camera
      const updatedProject = await apiClient.updateCamera(projectId, id, updatedCamera);
      
      // Update local state
      setProject(updatedProject);
      
      // Close dialog
      setEditCameraDialogOpen(false);
      setSelectedCamera(null);
    } catch (err) {
      console.error("Failed to update camera:", err);
      setError("Failed to update camera. Please try again later.");
    }
  };

  // Function to delete a camera
  const handleDeleteCamera = async () => {
    if (!project || !selectedCamera) return;

    try {
      // Call API client to delete camera
      const updatedProject = await apiClient.deleteCamera(projectId, selectedCamera.id);
      
      // Update local state
      setProject(updatedProject);
      
      // Close dialog and reset selected camera
      setDeleteCameraDialogOpen(false);
      setSelectedCamera(null);
    } catch (err) {
      console.error("Failed to delete camera:", err);
      setError("Failed to delete camera. Please try again later.");
    }
  };

  // Check if a camera has any configurations in any areas
  const cameraHasConfigurations = (cameraId: string): boolean => {
    if (!project) return false;

    return project.areas.some(area =>
      area.camera_configs.some(config => config.camera_id === cameraId)
    );
  };

  // Area management functions

  // Function to add a new area
  const handleAddArea = async (id: string, name: string) => {
    if (!project) return;

    try {
      // Create new area object
      const newArea = {
        id,
        name
      };

      // Call API client to add area
      const updatedProject = await apiClient.addArea(projectId, newArea);
      
      // Update local state
      setProject(updatedProject);
      
      // Close dialog
      setAddAreaDialogOpen(false);
    } catch (err) {
      console.error("Failed to add area:", err);
      setError("Failed to add area. Please try again later.");
    }
  };

  // Function to update an existing area
  const handleUpdateArea = async (id: string, name: string) => {
    if (!project) return;

    try {
      // Create area update object
      const updatedArea = {
        name
      };
      
      // Call API client to update area
      const updatedProject = await apiClient.updateArea(projectId, id, updatedArea);
      
      // Update local state
      setProject(updatedProject);
      
      // Close dialog
      setEditAreaDialogOpen(false);
      setSelectedArea(null);
    } catch (err) {
      console.error("Failed to update area:", err);
      setError("Failed to update area. Please try again later.");
    }
  };

  // Function to delete an area
  const handleDeleteArea = async () => {
    if (!project || !selectedArea) return;

    try {
      // Call API client to delete area
      const updatedProject = await apiClient.deleteArea(projectId, selectedArea.id);
      
      // Update local state
      setProject(updatedProject);
      
      // Close dialog and reset selected area
      setDeleteAreaDialogOpen(false);
      setSelectedArea(null);
      
      // If we're viewing this area's detail, go back to the project view
      if (selectedAreaId === selectedArea.id) {
        setSelectedAreaId(null);
      }
    } catch (err) {
      console.error("Failed to delete area:", err);
      setError("Failed to delete area. Please try again later.");
    }
  };

  // Camera configuration management functions

  // Function to add a camera configuration to an area
  const handleAddCameraConfig = async (
    areaId: string,
    id: string,
    name: string,
    cameraId: string,
    position: Position,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean,
    maskingEdges?: Edge[],
    heatmapConfig?: [number, number, number, number],
  ) => {
    if (!project) return;
    
    try {
      // Create new camera configuration
      const newConfig: CameraConfigCreate = {
        id: id,
        name: name,
        camera_id: cameraId,
        position: position,
        enable_heatmap: enableHeatmap,
        heatmap_config: heatmapConfig,
        enable_interpolation: enableInterpolation,
        enable_masking: enableMasking,
        masking_edges: enableMasking ? maskingEdges : undefined
      };
      
      // Call API client to add camera configuration
      const updatedProject = await apiClient.addCameraConfig(projectId, areaId, newConfig);
      
      // Update local state
      setProject(updatedProject);
    } catch (err) {
      console.error("Failed to add camera configuration:", err);
      setError("Failed to add camera configuration. Please try again later.");
    }
  };

  // Function to update a camera configuration
  const handleEditCameraConfig = async (
    areaId: string,
    configId: string,     // Changed from cameraId, originalPosition
    configName: string,   // Added parameter
    cameraId: string,
    position: Position,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean,
    maskingEdges?: Edge[],
    heatmapConfig?: [number, number, number, number],
  ) => {
    if (!project) return;
    
    try {
      // Create updated camera configuration
      const updatedConfig: CameraConfigUpdate = {
        name: configName,
        camera_id: cameraId,
        position,
        enable_heatmap: enableHeatmap,
        heatmap_config: heatmapConfig,
        enable_interpolation: enableInterpolation,
        enable_masking: enableMasking,
        masking_edges: enableMasking && maskingEdges ? maskingEdges : undefined
      };
      
      // Call API client to update camera configuration
      const updatedProject = await apiClient.updateCameraConfig(
        projectId, 
        areaId, 
        configId,   // Just passing the config ID now
        updatedConfig
      );
      
      // Update local state
      setProject(updatedProject);
    } catch (err) {
      console.error("Failed to update camera configuration:", err);
      setError("Failed to update camera configuration. Please try again later.");
    }
  };

  // Function to delete a camera configuration
  const handleDeleteCameraConfig = async (
    areaId: string,
    configId: string    // Just use config ID
  ) => {
    if (!project) return;
    
    try {
      // Call API client to delete camera configuration
      const updatedProject = await apiClient.deleteCameraConfig(
        projectId, 
        areaId, 
        configId     // Just use the config ID
      );
      
      // Update local state
      setProject(updatedProject);
    } catch (err) {
      console.error("Failed to delete camera configuration:", err);
      setError("Failed to delete camera configuration. Please try again later.");
    }
  };

  const handleOpenAddCameraDialog = () => {
    setAddCameraDialogOpen(true);
  };

  const handleOpenEditCameraDialog = (cameraId: string) => {
    const camera = project?.cameras.find(c => c.id === cameraId);
    if (camera) {
      setSelectedCamera(camera);
      setEditCameraDialogOpen(true);
    }
  };

  const handleOpenDeleteCameraDialog = (cameraId: string) => {
    const camera = project?.cameras.find(c => c.id === cameraId);
    if (camera) {
      setSelectedCamera(camera);
      setDeleteCameraDialogOpen(true);
    }
  };

  // Area event handlers
  const handleOpenAddAreaDialog = () => {
    setAddAreaDialogOpen(true);
  };

  const handleOpenEditAreaDialog = (areaId: string) => {
    const area = project?.areas.find(a => a.id === areaId);
    if (area) {
      setSelectedArea(area);
      setEditAreaDialogOpen(true);
    }
  };

  const handleOpenDeleteAreaDialog = (areaId: string) => {
    const area = project?.areas.find(a => a.id === areaId);
    if (area) {
      setSelectedArea(area);
      setDeleteAreaDialogOpen(true);
    }
  };

  const handleConfigureArea = (areaId: string) => {
    setSelectedAreaId(areaId);
  };

  const handleBackToAreas = () => {
    setSelectedAreaId(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="mb-8">
          <Skeleton className="h-16 w-full mb-4" />
        </div>

        <div className="space-y-8">
          <div>
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          <div>
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Project Details</h1>
        </div>

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">{error || "Project not found"}</p>
          <p className="text-sm mt-1">Please go back and select a valid project.</p>
          <div className="mt-4">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Find the selected area for detail view if any
  const selectedAreaForDetail = selectedAreaId
    ? project.areas.find(area => area.id === selectedAreaId)
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button and project name */}
      <div className="flex items-center mb-6">
        <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--tensora-dark)]">{project.name}</h1>
      </div>

      {/* Project dashboard button */}
      <div className="mb-10">
        <DashboardButton projectId={projectId} />
      </div>

      {/* Conditional rendering based on whether an area is selected */}
      {!selectedAreaForDetail ? (
        // Main project overview with individual cards
        <div className="space-y-10">
          {/* Camera Section */}
          <div>
            <SectionHeader
              icon={<Camera className="h-6 w-6" />}
              title="Camera Inventory"
              count={project.cameras.length}
              countLabel="camera"
            />

            <div className="space-y-4">
              {/* Grid of camera cards */}
              {project.cameras.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.cameras.map(camera => (
                    <CameraCard
                      key={camera.id}
                      id={camera.id}
                      name={camera.name}
                      resolution={camera.resolution}
                      onEdit={handleOpenEditCameraDialog}
                      onDelete={handleOpenDeleteCameraDialog}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-[var(--tensora-light)]/5 rounded-lg">
                  <p className="text-gray-500">No cameras in your inventory</p>
                  <p className="text-sm text-gray-400 mt-1">Add cameras to start monitoring</p>
                </div>
              )}

              {/* Add camera button */}
              <AddButton
                label="Add Camera"
                onClick={handleOpenAddCameraDialog}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Areas Section */}
          <div>
            <SectionHeader
              icon={<Map className="h-6 w-6" />}
              title="Monitoring Areas"
              count={project.areas.length}
              countLabel="area"
            />

            <div className="space-y-4">
              {/* Grid of area cards */}
              {project.areas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.areas.map(area => (
                    <AreaCard
                      key={area.id}
                      id={area.id}
                      name={area.name}
                      cameraCount={area.camera_configs.length}
                      onConfigure={handleConfigureArea}
                      onEdit={handleOpenEditAreaDialog}
                      onDelete={handleOpenDeleteAreaDialog}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-[var(--tensora-light)]/5 rounded-lg">
                  <p className="text-gray-500">No monitoring areas configured</p>
                  <p className="text-sm text-gray-400 mt-1">Add areas to define monitoring zones</p>
                </div>
              )}

              {/* Add area button */}
              <AddButton
                label="Add Area"
                onClick={handleOpenAddAreaDialog}
              />
            </div>
          </div>
        </div>
      ) : (
        // Area detail view
        <div className="mb-8">
          <AreaDetailCard
            areaId={selectedAreaForDetail.id}
            areaName={selectedAreaForDetail.name}
            cameraConfigs={selectedAreaForDetail.camera_configs}
            availableCameras={project.cameras}
            onBack={handleBackToAreas}
            onAddCameraConfig={handleAddCameraConfig}
            onEditCameraConfig={handleEditCameraConfig}
            onDeleteCameraConfig={handleDeleteCameraConfig}
          />
        </div>
      )}

      {/* CAMERA MANAGEMENT DIALOGS */}

      {/* Dialog for adding a new camera */}
      <AddCameraDialog
        isOpen={addCameraDialogOpen}
        onClose={() => setAddCameraDialogOpen(false)}
        onAdd={handleAddCamera}
      />

      {/* Dialog for editing a camera */}
      <EditCameraDialog
        isOpen={editCameraDialogOpen}
        onClose={() => {
          setEditCameraDialogOpen(false);
          setSelectedCamera(null);
        }}
        onUpdate={handleUpdateCamera}
        camera={selectedCamera}
      />

      {/* Dialog for deleting a camera */}
      {selectedCamera && (
        <DeleteCameraDialog
          isOpen={deleteCameraDialogOpen}
          onClose={() => {
            setDeleteCameraDialogOpen(false);
            setSelectedCamera(null);
          }}
          onConfirm={handleDeleteCamera}
          cameraName={selectedCamera.name}
          hasConfigurations={cameraHasConfigurations(selectedCamera.id)}
        />
      )}

      {/* AREA MANAGEMENT DIALOGS */}

      {/* Dialog for adding a new area */}
      <AddAreaDialog
        isOpen={addAreaDialogOpen}
        onClose={() => setAddAreaDialogOpen(false)}
        onAdd={handleAddArea}
      />

      {/* Dialog for editing an area */}
      <EditAreaDialog
        isOpen={editAreaDialogOpen}
        onClose={() => {
          setEditAreaDialogOpen(false);
          setSelectedArea(null);
        }}
        onUpdate={handleUpdateArea}
        area={selectedArea}
      />

      {/* Dialog for deleting an area */}
      {selectedArea && (
        <DeleteAreaDialog
          isOpen={deleteAreaDialogOpen}
          onClose={() => {
            setDeleteAreaDialogOpen(false);
            setSelectedArea(null);
          }}
          onConfirm={handleDeleteArea}
          areaName={selectedArea.name}
          hasCameraConfigs={selectedArea.camera_configs.length > 0}
          cameraConfigCount={selectedArea.camera_configs.length}
        />
      )}
    </div>
  );
}