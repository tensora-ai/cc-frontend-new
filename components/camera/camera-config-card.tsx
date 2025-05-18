import { Settings, Camera, MapPin, Trash2, BarChart, Maximize, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Position } from "@/models/project";

interface CameraConfigCardProps {
  cameraName: string;
  position: Position;
  enableHeatmap: boolean;
  heatmapConfig?: [number, number, number, number];
  enableInterpolation: boolean;
  enableMasking: boolean;
  maskingEdges?: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function CameraConfigCard({
  cameraName,
  position,
  enableHeatmap,
  heatmapConfig,
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
                Position: <span className="font-medium ml-1">{position.name}</span>
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
          <Feature 
            name="Heatmap" 
            enabled={enableHeatmap} 
            icon={<BarChart className="h-3 w-3" />} 
          />
          <Feature 
            name="Interpolation" 
            enabled={enableInterpolation} 
            icon={<Activity className="h-3 w-3" />} 
          />
          <Feature 
            name="Masking" 
            enabled={enableMasking} 
            icon={<Maximize className="h-3 w-3" />} 
          />
        </div>
        
        {/* Position Details */}
        {(position.center_ground_plane || position.focal_length) && (
          <div className="bg-[var(--tensora-light)]/5 rounded-md p-2 mb-3 text-xs">
            <p className="font-medium text-gray-600 mb-1">Position Details:</p>
            {position.center_ground_plane && (
              <div className="flex items-center mb-1">
                <span className="text-gray-500 mr-1">Center Ground Plane:</span>
                <span className="font-medium">
                  [{position.center_ground_plane[0]}, {position.center_ground_plane[1]}]
                </span>
              </div>
            )}
            {position.focal_length && (
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">Focal Length:</span>
                <span className="font-medium">{position.focal_length}m</span>
              </div>
            )}
          </div>
        )}
        
        {/* Heatmap Configuration */}
        {enableHeatmap && heatmapConfig && (
          <div className="bg-[var(--tensora-light)]/5 rounded-md p-2 mb-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-gray-600">Heatmap Configuration:</p>
              <BarChart className="h-3 w-3 text-[var(--tensora-medium)]" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="bg-[var(--tensora-light)]/10 rounded px-2 py-1">
                [{heatmapConfig.map((value, index) => (
                  <span key={index}>{index > 0 ? ', ' : ''}{value}</span>
                ))}]
              </div>
            </div>
          </div>
        )}
        
        {/* Masking Configuration */}
        {enableMasking && maskingEdges && (
          <div className="mt-2 px-3 py-2 bg-[var(--tensora-light)]/5 rounded-md text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Masking configuration: {maskingEdges} points defined</span>
              <Maximize className="h-3 w-3 text-[var(--tensora-medium)]" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for feature pills
function Feature({ name, enabled, icon }: { name: string; enabled: boolean; icon?: React.ReactNode }) {
  return (
    <div 
      className={`px-3 py-1.5 rounded-md text-center flex items-center justify-center gap-1 ${
        enabled 
          ? 'bg-green-50 text-green-700 border border-green-100' 
          : 'bg-gray-100 text-gray-500 border border-gray-200'
      }`}
    >
      {icon && <span className={enabled ? 'text-green-600' : 'text-gray-400'}>{icon}</span>}
      {name}: {enabled ? 'On' : 'Off'}
    </div>
  );
}