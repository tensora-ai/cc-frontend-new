"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Map, AlertCircle, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/models/auth";
import { Project, Edge, CountingModel, ModelSchedule, Position, CameraConfig, CameraConfigCreate, CameraConfigUpdate, MaskingConfig } from "@/models/project";
import { apiClient } from "@/lib/api-client";

// Import your existing components
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

// Component that redirects PROJECT_OPERATOR to dashboard
function ProjectOperatorRedirect() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;

  useEffect(() => {
    // Redirect PROJECT_OPERATOR to dashboard immediately
    router.replace(`/project/${projectId}/dashboard`);
  }, [projectId, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-[var(--tensora-medium)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--tensora-dark)] mb-2">
            Redirecting to Dashboard
          </h2>
          <p className="text-gray-600 mb-4">
            You have access to the dashboard for this project.
          </p>
          <Link href={`/project/${projectId}/dashboard`}>
            <Button className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)]">
              <BarChart3 className="h-4 w-4 mr-2" /> Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Access denied component for project settings
function ProjectSettingsAccessDenied({ projectId }: { projectId: string }) {
  const auth = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-[var(--tensora-medium)] hover:text-[var(--tensora-dark)] mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Project Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
            <Shield className="h-8 w-8 text-amber-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Project Settings Access Restricted
          </h2>

          {/* User info */}
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Signed in as:</p>
            <p className="font-medium text-gray-900">{auth.display.getUserDisplayName()}</p>
            <p className="text-sm text-gray-500">{auth.display.getUserRoleDisplay()}</p>
          </div>

          {/* Reason */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  Project Settings Not Available
                </p>
                <p className="text-sm text-amber-700">
                  Your role ({auth.display.getUserRoleDisplay()}) allows you to view the dashboard but not modify project settings.
                </p>
              </div>
            </div>
          </div>

          {/* Available actions */}
          <div className="text-left mb-6">
            <p className="text-sm font-medium text-gray-900 mb-2">What you can do:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Access the dashboard to view crowd counting data
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Contact your administrator if you need to modify project settings
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Return to the project list to view other projects you have access to
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/project/${projectId}/dashboard`}>
              <Button className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)] text-white">
                <BarChart3 className="h-4 w-4 mr-2" /> Go to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Your existing ProjectDetailPageContent component (renamed for clarity)
function ProjectDetailPageContent() {
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

  // All your existing handler functions go here...
  // (I'm omitting them for brevity, but you'd copy all the handler functions from your original file)

  // Camera management functions
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
      const newCamera = {
        id,
        name,
        resolution,
        sensor_size: sensorSize,
        coordinates_3d: coordinates3d,
        default_model: defaultModel,
        model_schedules: modelSchedules
      };

      const updatedProject = await apiClient.addCamera(projectId, newCamera);
      setProject(updatedProject);
      setAddCameraDialogOpen(false);
    } catch (err) {
      console.error("Failed to add camera:", err);
      setError("Failed to add camera. Please try again later.");
    }
  };

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
      const updatedCamera = {
        name, 
        resolution,
        sensor_size: sensorSize,
        coordinates_3d: coordinates3d, 
        default_model: defaultModel, 
        model_schedules: modelSchedules 
      };
      
      const updatedProject = await apiClient.updateCamera(projectId, id, updatedCamera);
      setProject(updatedProject);
      setEditCameraDialogOpen(false);
      setSelectedCamera(null);
    } catch (err) {
      console.error("Failed to update camera:", err);
      setError("Failed to update camera. Please try again later.");
    }
  };

  const handleDeleteCamera = async () => {
    if (!project || !selectedCamera) return;

    try {
      const updatedProject = await apiClient.deleteCamera(projectId, selectedCamera.id);
      setProject(updatedProject);
      setDeleteCameraDialogOpen(false);
      setSelectedCamera(null);
    } catch (err) {
      console.error("Failed to delete camera:", err);
      setError("Failed to delete camera. Please try again later.");
    }
  };

  const cameraHasConfigurations = (cameraId: string): boolean => {
    if (!project) return false;
    return project.areas.some(area =>
      area.camera_configs.some(config => config.camera_id === cameraId)
    );
  };

  // Area management functions
  const handleAddArea = async (id: string, name: string) => {
    if (!project) return;

    try {
      const newArea = { id, name };
      const updatedProject = await apiClient.addArea(projectId, newArea);
      setProject(updatedProject);
      setAddAreaDialogOpen(false);
    } catch (err) {
      console.error("Failed to add area:", err);
      setError("Failed to add area. Please try again later.");
    }
  };

  const handleUpdateArea = async (id: string, name: string) => {
    if (!project) return;

    try {
      const updatedArea = { name };
      const updatedProject = await apiClient.updateArea(projectId, id, updatedArea);
      setProject(updatedProject);
      setEditAreaDialogOpen(false);
      setSelectedArea(null);
    } catch (err) {
      console.error("Failed to update area:", err);
      setError("Failed to update area. Please try again later.");
    }
  };

  const handleDeleteArea = async () => {
    if (!project || !selectedArea) return;

    try {
      const updatedProject = await apiClient.deleteArea(projectId, selectedArea.id);
      setProject(updatedProject);
      setDeleteAreaDialogOpen(false);
      setSelectedArea(null);
      
      if (selectedAreaId === selectedArea.id) {
        setSelectedAreaId(null);
      }
    } catch (err) {
      console.error("Failed to delete area:", err);
      setError("Failed to delete area. Please try again later.");
    }
  };

  // Camera configuration management functions
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
      const masking_config: MaskingConfig = {
        edges: maskingEdges || []
      }

      const newConfig: CameraConfigCreate = {
        id: id,
        name: name,
        camera_id: cameraId,
        position: position,
        enable_heatmap: enableHeatmap,
        heatmap_config: heatmapConfig,
        enable_interpolation: enableInterpolation,
        enable_masking: enableMasking,
        masking_config: masking_config
      };
      
      const updatedProject = await apiClient.addCameraConfig(projectId, areaId, newConfig);
      setProject(updatedProject);
    } catch (err) {
      console.error("Failed to add camera configuration:", err);
      setError("Failed to add camera configuration. Please try again later.");
    }
  };

  const handleEditCameraConfig = async (
    areaId: string,
    configId: string,
    configName: string,
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
      const masking_config: MaskingConfig = {
        edges: maskingEdges || []
      }

      const updatedConfig: CameraConfigUpdate = {
        name: configName,
        camera_id: cameraId,
        position,
        enable_heatmap: enableHeatmap,
        heatmap_config: heatmapConfig,
        enable_interpolation: enableInterpolation,
        enable_masking: enableMasking,
        masking_config: masking_config
      };
      
      const updatedProject = await apiClient.updateCameraConfig(
        projectId, 
        areaId, 
        configId,
        updatedConfig
      );
      
      setProject(updatedProject);
    } catch (err) {
      console.error("Failed to update camera configuration:", err);
      setError("Failed to update camera configuration. Please try again later.");
    }
  };

  const handleDeleteCameraConfig = async (
    areaId: string,
    configId: string
  ) => {
    if (!project) return;
    
    try {
      const updatedProject = await apiClient.deleteCameraConfig(
        projectId, 
        areaId, 
        configId
      );
      
      setProject(updatedProject);
    } catch (err) {
      console.error("Failed to delete camera configuration:", err);
      setError("Failed to delete camera configuration. Please try again later.");
    }
  };

  // Event handlers
  const handleOpenAddCameraDialog = () => setAddCameraDialogOpen(true);
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

  const handleOpenAddAreaDialog = () => setAddAreaDialogOpen(true);
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

      {/* All your dialog components */}
      <AddCameraDialog
        isOpen={addCameraDialogOpen}
        onClose={() => setAddCameraDialogOpen(false)}
        onAdd={handleAddCamera}
      />

      <EditCameraDialog
        isOpen={editCameraDialogOpen}
        onClose={() => {
          setEditCameraDialogOpen(false);
          setSelectedCamera(null);
        }}
        onUpdate={handleUpdateCamera}
        camera={selectedCamera}
      />

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

      <AddAreaDialog
        isOpen={addAreaDialogOpen}
        onClose={() => setAddAreaDialogOpen(false)}
        onAdd={handleAddArea}
      />

      <EditAreaDialog
        isOpen={editAreaDialogOpen}
        onClose={() => {
          setEditAreaDialogOpen(false);
          setSelectedArea(null);
        }}
        onUpdate={handleUpdateArea}
        area={selectedArea}
      />

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

// Main component with role-based access control
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.project_id as string;
  const auth = useAuth();

  // Custom permission check for project settings
  const canViewProjectSettings = (auth: ReturnType<typeof useAuth>) => {
    if (!auth.user || !projectId) return false;
    
    // PROJECT_OPERATOR cannot view project settings
    if (auth.user.role === UserRole.PROJECT_OPERATOR) {
      return false;
    }
    
    // Check if user can view project settings for this specific project
    return auth.permissions.canViewProjectSettings(projectId);
  };

  return (
    <ProtectedRoute
      projectId={projectId}
      requireProjectAccess={true}
    >
      {/* Role-based routing logic */}
      {auth.user?.role === UserRole.PROJECT_OPERATOR ? (
        <ProjectOperatorRedirect />
      ) : (
        <ProtectedRoute
          customPermissionCheck={canViewProjectSettings}
          fallbackComponent={<ProjectSettingsAccessDenied projectId={projectId} />}
        >
          <ProjectDetailPageContent />
        </ProtectedRoute>
      )}
    </ProtectedRoute>
  );
}