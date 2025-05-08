import { Settings, Camera, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CameraConfigCardProps {
  cameraId: string;
  cameraName: string;
  position: string;
  enableHeatmap: boolean;
  enableInterpolation: boolean;
  enableMasking: boolean;
  maskingEdges?: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function CameraConfigCard({
  cameraId,
  cameraName,
  position,
  enableHeatmap,
  enableInterpolation,
  enableMasking,
  maskingEdges,
  onEdit,
  onDelete,
}: CameraConfigCardProps) {
  return (
    <Card className="overflow-hidden hover:border-[var(--tensora-medium)] transition-colors">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start">
            <Camera className="h-5 w-5 text-[var(--tensora-medium)] mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium text-[var(--tensora-dark)]">{cameraName}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                <MapPin className="h-3 w-3 mr-1" /> 
                Position: <span className="font-medium ml-1">{position}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-[var(--tensora-medium)]"
              onClick={onEdit}
              title="Edit Configuration"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-red-600"
              onClick={onDelete}
              title="Delete Configuration"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <Feature name="Heatmap" enabled={enableHeatmap} />
          <Feature name="Interpolation" enabled={enableInterpolation} />
          <Feature name="Masking" enabled={enableMasking} />
        </div>
        
        {enableMasking && maskingEdges && (
          <div className="mt-2 px-3 py-2 bg-[var(--tensora-light)]/5 rounded-md text-xs text-gray-500">
            Masking configuration: {maskingEdges} points defined
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for feature pills
function Feature({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <div 
      className={`px-3 py-1.5 rounded-md text-center ${
        enabled 
          ? 'bg-green-50 text-green-700 border border-green-100' 
          : 'bg-gray-100 text-gray-500 border border-gray-200'
      }`}
    >
      {name}: {enabled ? 'On' : 'Off'}
    </div>
  );
}