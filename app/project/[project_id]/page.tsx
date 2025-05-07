"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Camera, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Project, CameraConfig, Edge } from "@/models/project";
import { getProjectById } from "@/data/sample-projects";

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
    camera_configs: any[];
  } | null>(null);

  // Load project data
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // const response = await fetch(`/api/projects/${projectId}`);
        // const data = await response.json();
        
        // Simulating API call with sample data
        setTimeout(() => {
          const projectData = getProjectById(projectId);
          
          if (projectData) {
            setProject(projectData);
          } else {
            setError("Project not found");
          }
          
          setLoading(false);
        }, 1000);
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
  const handleAddCamera = (id: string, name: string, resolution: [number, number]) => {
    if (!project) return;
    
    // Create new camera object
    const newCamera = {
      id,
      name,
      resolution
    };
    
    // Add camera to project (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/cameras`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newCamera)
    // });
    
    // Update local state
    setProject({
      ...project,
      cameras: [...project.cameras, newCamera]
    });
  };
  
  // Function to update an existing camera
  const handleUpdateCamera = (id: string, name: string, resolution: [number, number]) => {
    if (!project) return;
    
    // Update camera in project (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/cameras/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name, resolution })
    // });
    
    // Update local state
    setProject({
      ...project,
      cameras: project.cameras.map(camera => 
        camera.id === id 
          ? { ...camera, name, resolution } 
          : camera
      )
    });
  };
  
  // Function to delete a camera
  const handleDeleteCamera = () => {
    if (!project || !selectedCamera) return;
    
    // Delete camera from project (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/cameras/${selectedCamera.id}`, {
    //   method: 'DELETE'
    // });
    
    // If this camera has configurations in any areas, remove them
    const updatedAreas = project.areas.map(area => ({
      ...area,
      camera_configs: area.camera_configs.filter(
        config => config.camera_id !== selectedCamera.id
      )
    }));
    
    // Update local state
    setProject({
      ...project,
      cameras: project.cameras.filter(camera => camera.id !== selectedCamera.id),
      areas: updatedAreas
    });
    
    // Close dialog and reset selected camera
    setDeleteCameraDialogOpen(false);
    setSelectedCamera(null);
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
  const handleAddArea = (id: string, name: string) => {
    if (!project) return;
    
    // Create new area object
    const newArea = {
      id,
      name,
      camera_configs: []
    };
    
    // Add area to project (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/areas`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newArea)
    // });
    
    // Update local state
    setProject({
      ...project,
      areas: [...project.areas, newArea]
    });
  };
  
  // Function to update an existing area
  const handleUpdateArea = (id: string, name: string) => {
    if (!project) return;
    
    // Update area in project (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/areas/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name })
    // });
    
    // Update local state
    setProject({
      ...project,
      areas: project.areas.map(area => 
        area.id === id 
          ? { ...area, name } 
          : area
      )
    });
  };
  
  // Function to delete an area
  const handleDeleteArea = () => {
    if (!project || !selectedArea) return;
    
    // Delete area from project (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/areas/${selectedArea.id}`, {
    //   method: 'DELETE'
    // });
    
    // Update local state
    setProject({
      ...project,
      areas: project.areas.filter(area => area.id !== selectedArea.id)
    });
    
    // Close dialog and reset selected area
    setDeleteAreaDialogOpen(false);
    setSelectedArea(null);
    
    // If we're viewing this area's detail, go back to the project view
    if (selectedAreaId === selectedArea.id) {
      setSelectedAreaId(null);
    }
  };
  
  // Camera configuration management functions
  
  // Function to add a camera configuration to an area
  const handleAddCameraConfig = (
    areaId: string,
    cameraId: string,
    position: string,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean
  ) => {
    if (!project) return;
    
    // Create new camera configuration
    const newConfig: CameraConfig = {
      camera_id: cameraId,
      position: position,
      enable_heatmap: enableHeatmap,
      enable_interpolation: enableInterpolation,
      enable_masking: enableMasking,
      // If masking is enabled, create an empty masking config
      masking_config: enableMasking ? { edges: [] } : undefined
    };
    
    // Find the area
    const area = project.areas.find(area => area.id === areaId);
    
    if (!area) return;
    
    // Check if this camera is already configured in this position
    const existingConfig = area.camera_configs.find(
      config => config.camera_id === cameraId && config.position === position
    );
    
    // If there's an existing config, show an error
    if (existingConfig) {
      alert(`Camera "${cameraId}" is already configured in position "${position}"`);
      return;
    }
    
    // Add camera configuration to area (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/areas/${areaId}/camera-configs`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newConfig)
    // });
    
    // Update local state
    setProject({
      ...project,
      areas: project.areas.map(area => 
        area.id === areaId
          ? { ...area, camera_configs: [...area.camera_configs, newConfig] }
          : area
      )
    });
  };
  
  // Function to update a camera configuration
  const handleEditCameraConfig = (
    areaId: string,
    cameraId: string,
    originalPosition: string,
    newPosition: string,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean,
    maskingEdges?: Edge[]
  ) => {
    if (!project) return;
    
    // Find the area
    const area = project.areas.find(area => area.id === areaId);
    
    if (!area) return;
    
    // Find the camera configuration
    const configIndex = area.camera_configs.findIndex(
      config => config.camera_id === cameraId && config.position === originalPosition
    );
    
    if (configIndex === -1) return;
    
    // Create updated configuration
    const updatedConfig = {
      ...area.camera_configs[configIndex],
      position: newPosition,
      enable_heatmap: enableHeatmap,
      enable_interpolation: enableInterpolation,
      enable_masking: enableMasking,
    };
    
    // Handle masking configuration
    if (!enableMasking) {
      // If masking was disabled, remove masking config
      delete updatedConfig.masking_config;
    } else if (maskingEdges && maskingEdges.length > 0) {
      // If new masking edges were provided, update config
      updatedConfig.masking_config = { edges: maskingEdges };
    } else if (!updatedConfig.masking_config) {
      // If masking was enabled but no config exists, create empty config
      updatedConfig.masking_config = { edges: [] };
    }
    
    // If position changed, check if it conflicts with an existing config
    if (originalPosition !== newPosition) {
      const existingConfig = area.camera_configs.find(
        config => config !== area.camera_configs[configIndex] &&
                 config.camera_id === cameraId && 
                 config.position === newPosition
      );
      
      if (existingConfig) {
        alert(`Camera "${cameraId}" is already configured in position "${newPosition}"`);
        return;
      }
    }
    
    // Update camera configuration (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/areas/${areaId}/camera-configs/${cameraId}/${originalPosition}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     position: newPosition,
    //     enable_heatmap: enableHeatmap,
    //     enable_interpolation: enableInterpolation,
    //     enable_masking: enableMasking
    //   })
    // });
    
    // Update local state
    const updatedConfigs = [...area.camera_configs];
    updatedConfigs[configIndex] = updatedConfig;
    
    setProject({
      ...project,
      areas: project.areas.map(area => 
        area.id === areaId
          ? { ...area, camera_configs: updatedConfigs }
          : area
      )
    });
  };
  
  // Function to delete a camera configuration
  const handleDeleteCameraConfig = (
    areaId: string,
    cameraId: string,
    position: string
  ) => {
    if (!project) return;
    
    // Find the area
    const area = project.areas.find(area => area.id === areaId);
    
    if (!area) return;
    
    // Delete camera configuration (in a real app, this would be an API call)
    // await fetch(`/api/projects/${projectId}/areas/${areaId}/camera-configs/${cameraId}/${position}`, {
    //   method: 'DELETE'
    // });
    
    // Update local state
    setProject({
      ...project,
      areas: project.areas.map(area => 
        area.id === areaId
          ? { 
              ...area, 
              camera_configs: area.camera_configs.filter(
                config => !(config.camera_id === cameraId && config.position === position)
              )
            }
          : area
      )
    });
  };
  
  // Camera event handlers
  const handleOpenDashboard = () => {
    alert("Dashboard would open here");
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
        <DashboardButton onClick={handleOpenDashboard} />
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