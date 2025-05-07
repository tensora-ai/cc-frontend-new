import { ChevronLeft, Map, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraConfigCard } from "@/components/camera/camera-config-card";
import { AddButton } from "@/components/project/add-button";

interface Camera {
  id: string;
  name: string;
  resolution: [number, number];
}

interface CameraConfig {
  camera_id: string;
  position: string;
  enable_heatmap: boolean;
  enable_interpolation: boolean;
  enable_masking: boolean;
  masking_config?: {
    edges: [number, number][];
  };
}

interface AreaDetailCardProps {
  areaId: string;
  areaName: string;
  cameraConfigs: CameraConfig[];
  availableCameras: Camera[];
  onBack: () => void;
  onAddCameraConfig: (areaId: string) => void;
  onEditCameraConfig: (areaId: string, cameraId: string, position: string) => void;
}

export function AreaDetailCard({
  areaId,
  areaName,
  cameraConfigs,
  availableCameras,
  onBack,
  onAddCameraConfig,
  onEditCameraConfig
}: AreaDetailCardProps) {
  // Check if there are any camera configurations
  const hasCameraConfigs = cameraConfigs.length > 0;
  
  // Check if there are available cameras to add
  const canAddCamera = availableCameras.length > 0;

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
                  <CameraConfigCard
                    key={`${config.camera_id}-${config.position}-${index}`}
                    cameraId={config.camera_id}
                    cameraName={cameraName}
                    position={config.position}
                    enableHeatmap={config.enable_heatmap}
                    enableInterpolation={config.enable_interpolation}
                    enableMasking={config.enable_masking}
                    maskingEdges={config.masking_config?.edges.length}
                    onEdit={() => onEditCameraConfig(areaId, config.camera_id, config.position)}
                  />
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
              onClick={() => onAddCameraConfig(areaId)} 
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
    </div>
  );
}