import { useState } from "react";
import { ChevronLeft, Map, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraConfigCard } from "@/components/camera/camera-config-card";
import { AddButton } from "@/components/project/add-button";
import { AddCameraConfigDialog } from "@/components/camera-config/add-camera-config-dialog";
import { EditCameraConfigDialog } from "@/components/camera-config/edit-camera-config-dialog";
import { DeleteCameraConfigDialog } from "@/components/camera-config/delete-camera-config-dialog";
import { Camera, CameraConfig, Edge, Position } from "@/models/project";

interface AreaDetailCardProps {
  areaId: string;
  areaName: string;
  cameraConfigs: CameraConfig[];
  availableCameras: Camera[];
  onBack: () => void;
  onAddCameraConfig: (
    areaId: string,
    cameraId: string,
    position: Position,
    enableHeatmap: boolean,
    enableInterpolation: boolean, 
    enableMasking: boolean,
    maskingEdges?: Edge[],
    heatmapConfig?: [number, number, number, number],
  ) => void;
  onEditCameraConfig: (
    areaId: string,
    cameraId: string,
    originalPosition: string,
    position: Position,
    enableHeatmap: boolean,
    enableInterpolation: boolean, 
    enableMasking: boolean,
    maskingEdges?: Edge[],
    heatmapConfig?: [number, number, number, number],
  ) => void;
  onDeleteCameraConfig: (
    areaId: string,
    cameraId: string,
    position: string
  ) => void;
}

export function AreaDetailCard({
  areaId,
  areaName,
  cameraConfigs,
  availableCameras,
  onBack,
  onAddCameraConfig,
  onEditCameraConfig,
  onDeleteCameraConfig
}: AreaDetailCardProps) {
  // Check if there are any camera configurations
  const hasCameraConfigs = cameraConfigs.length > 0;
  
  // Check if there are available cameras to add
  const canAddCamera = availableCameras.length > 0;

  // Dialog states
  const [addConfigDialogOpen, setAddConfigDialogOpen] = useState(false);
  const [editConfigDialogOpen, setEditConfigDialogOpen] = useState(false);
  const [deleteConfigDialogOpen, setDeleteConfigDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<CameraConfig | null>(null);

  // Find camera by ID
  const findCameraById = (cameraId: string): Camera | null => {
    return availableCameras.find(camera => camera.id === cameraId) || null;
  };

  // Handle opening edit dialog
  const handleOpenEditConfig = (cameraId: string, positionName: string) => {
    const config = cameraConfigs.find(
      config => config.camera_id === cameraId && config.position.name === positionName
    );
    
    if (config) {
      setSelectedConfig(config);
      setEditConfigDialogOpen(true);
    }
  };

  // Handle opening delete dialog
  const handleOpenDeleteConfig = (cameraId: string, positionName: string) => {
    const config = cameraConfigs.find(
      config => config.camera_id === cameraId && config.position.name === positionName
    );
    
    if (config) {
      setSelectedConfig(config);
      setDeleteConfigDialogOpen(true);
    }
  };

  // Handle adding a camera configuration
  const handleAddCameraConfig = (
    cameraId: string,
    position: Position,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean,
    maskingEdges?: Edge[],
    heatmapConfig?: [number, number, number, number],
  ) => {
    onAddCameraConfig(
      areaId,
      cameraId,
      position,
      enableHeatmap,
      enableInterpolation,
      enableMasking,
      maskingEdges,
      heatmapConfig,
    );
  };

  // Handle editing a camera configuration
  const handleEditCameraConfig = (
    cameraId: string,
    originalPosition: string,
    position: Position,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean,
    maskingEdges?: Edge[],
    heatmapConfig?: [number, number, number, number],
  ) => {
    onEditCameraConfig(
      areaId,
      cameraId,
      originalPosition,
      position,
      enableHeatmap,
      enableInterpolation,
      enableMasking,
      maskingEdges,
      heatmapConfig,
    );
  };

  // Handle deleting a camera configuration
  const handleDeleteCameraConfig = () => {
    if (selectedConfig) {
      onDeleteCameraConfig(
        areaId,
        selectedConfig.camera_id,
        selectedConfig.position.name
      );
      setDeleteConfigDialogOpen(false);
      setSelectedConfig(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2 p-1.5 h-9 w-9 text-[var(--tensora-medium)]" 
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-[var(--tensora-dark)] flex items-center">
            <Map className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" /> 
            {areaName}
          </h2>
          <p className="text-sm text-gray-500">
            {cameraConfigs.length} {cameraConfigs.length === 1 ? 'camera' : 'cameras'} configured for this area
          </p>
        </div>
      </div>
      
      {/* Camera configurations */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Camera Configurations</CardTitle>
          <CardDescription>
            Configure which cameras are used in this monitoring area
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          {hasCameraConfigs ? (
            <div className="grid grid-cols-1 gap-4">
              {cameraConfigs.map((config, index) => {
                // Find the camera details
                const camera = availableCameras.find(c => c.id === config.camera_id);
                const cameraName = camera ? camera.name : config.camera_id;
                
                return (
                  <div key={`${config.camera_id}-${config.position.name}-${index}`} className="relative">
                    <CameraConfigCard
                      cameraId={config.camera_id}
                      cameraName={cameraName}
                      position={config.position}
                      enableHeatmap={config.enable_heatmap}
                      heatmapConfig={config.heatmap_config}
                      enableInterpolation={config.enable_interpolation}
                      enableMasking={config.enable_masking}
                      maskingEdges={config.masking_config?.edges.length}
                      onEdit={() => handleOpenEditConfig(config.camera_id, config.position.name)}
                      onDelete={() => handleOpenDeleteConfig(config.camera_id, config.position.name)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-[var(--tensora-light)]/5 rounded-lg">
              <p className="text-gray-500">No cameras configured for this area</p>
              <p className="text-sm text-gray-400 mt-1">Add a camera configuration to start monitoring</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-2 pb-6">
          {canAddCamera ? (
            <AddButton 
              label="Add Camera Configuration" 
              onClick={() => setAddConfigDialogOpen(true)} 
            />
          ) : (
            <Button 
              variant="outline" 
              className="w-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 h-12"
              disabled
            >
              <Plus className="mr-2 h-4 w-4" /> Create cameras first
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Add Camera Configuration Dialog */}
      <AddCameraConfigDialog
        isOpen={addConfigDialogOpen}
        onClose={() => setAddConfigDialogOpen(false)}
        onAdd={handleAddCameraConfig}
        availableCameras={availableCameras}
      />

      {/* Edit Camera Configuration Dialog */}
      {selectedConfig && (
        <EditCameraConfigDialog
          isOpen={editConfigDialogOpen}
          onClose={() => {
            setEditConfigDialogOpen(false);
            setSelectedConfig(null);
          }}
          onUpdate={handleEditCameraConfig}
          config={{
            cameraId: selectedConfig.camera_id,
            position: selectedConfig.position,
            enableHeatmap: selectedConfig.enable_heatmap,
            heatmapConfig: selectedConfig.heatmap_config,
            enableInterpolation: selectedConfig.enable_interpolation,
            enableMasking: selectedConfig.enable_masking,
            maskingEdges: selectedConfig.masking_config?.edges.length,
            maskingConfig: selectedConfig.masking_config
          }}
          availableCamera={findCameraById(selectedConfig.camera_id)}
        />
      )}

      {/* Delete Camera Configuration Dialog */}
      {selectedConfig && (
        <DeleteCameraConfigDialog
          isOpen={deleteConfigDialogOpen}
          onClose={() => {
            setDeleteConfigDialogOpen(false);
            setSelectedConfig(null);
          }}
          onConfirm={handleDeleteCameraConfig}
          cameraName={(findCameraById(selectedConfig.camera_id)?.name || selectedConfig.camera_id)}
          position={selectedConfig.position.name}
          hasMasking={selectedConfig.enable_masking && Boolean(selectedConfig.masking_config?.edges.length)}
        />
      )}
    </div>
  );
}