import { MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaskingConfig {
  edges: [number, number][];
}

interface CameraConfigProps {
  cameraId: string;
  cameraName: string;
  areaName: string;
  position: string;
  enableHeatmap: boolean;
  enableInterpolation: boolean;
  enableMasking: boolean;
  maskingConfig?: MaskingConfig;
  onEdit?: () => void;
}

export function CameraConfigItem({
  cameraId,
  cameraName,
  areaName,
  position,
  enableHeatmap,
  enableInterpolation,
  enableMasking,
  maskingConfig,
  onEdit
}: CameraConfigProps) {
  return (
    <div className="border rounded-lg p-4 hover:border-[var(--tensora-medium)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[var(--tensora-dark)]">
            {cameraName || cameraId}
          </h3>
          <p className="text-sm text-gray-500 flex items-center">
            <MapPin className="h-3 w-3 mr-1" /> 
            Area: {areaName} / Position: {position}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[var(--tensora-medium)]"
          onClick={onEdit}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className={`p-2 rounded-md ${enableHeatmap ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          Heatmap: {enableHeatmap ? 'On' : 'Off'}
        </div>
        <div className={`p-2 rounded-md ${enableInterpolation ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          Interpolation: {enableInterpolation ? 'On' : 'Off'}
        </div>
        <div className={`p-2 rounded-md ${enableMasking ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          Masking: {enableMasking ? 'On' : 'Off'}
        </div>
      </div>
      
      {maskingConfig && (
        <div className="mt-3 p-2 bg-[var(--tensora-light)]/10 rounded-md">
          <p className="text-xs text-gray-500">Masking edges: {maskingConfig.edges.length} points</p>
        </div>
      )}
    </div>
  );
}