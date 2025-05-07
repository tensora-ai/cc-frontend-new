"use client";

import { useState, useEffect } from "react";
import { Camera, MapPin, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Camera as CameraType, Edge } from "@/models/project";
import { MaskingEditor } from "@/components/camera-config/masking-editor";

interface EditCameraConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    cameraId: string,
    position: string,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean,
    maskingEdges?: Edge[]
  ) => void;
  config: {
    cameraId: string;
    position: string;
    enableHeatmap: boolean;
    enableInterpolation: boolean;
    enableMasking: boolean;
    maskingEdges?: number;
    maskingConfig?: {
      edges: Edge[];
    };
  } | null;
  availableCamera: CameraType | null;
}

export function EditCameraConfigDialog({
  isOpen,
  onClose,
  onUpdate,
  config,
  availableCamera
}: EditCameraConfigDialogProps) {
  // Form state
  const [position, setPosition] = useState<string>("");
  const [enableHeatmap, setEnableHeatmap] = useState<boolean>(false);
  const [enableInterpolation, setEnableInterpolation] = useState<boolean>(false);
  const [enableMasking, setEnableMasking] = useState<boolean>(false);
  const [maskingEdges, setMaskingEdges] = useState<Edge[]>([]);
  const [maskingEditorOpen, setMaskingEditorOpen] = useState<boolean>(false);
  
  // Validation state
  const [errors, setErrors] = useState<{
    position?: string;
  }>({});

  // Update form when config changes
  useEffect(() => {
    if (config) {
      setPosition(config.position);
      setEnableHeatmap(config.enableHeatmap);
      setEnableInterpolation(config.enableInterpolation);
      setEnableMasking(config.enableMasking);
      
      // Set masking edges from config if available
      if (config.maskingConfig && config.maskingConfig.edges) {
        setMaskingEdges(config.maskingConfig.edges);
      } else {
        // Set default edges if masking is enabled but no edges are defined
        if (config.enableMasking && availableCamera) {
          setMaskingEdges([
            [0, 0],
            [0, availableCamera.resolution[1]],
            [availableCamera.resolution[0], availableCamera.resolution[1]],
            [availableCamera.resolution[0], 0]
          ]);
        }
      }
    }
  }, [config, availableCamera]);

  // Handle form submission
  const handleSubmit = () => {
    if (!config || !availableCamera) return;
    
    // Reset errors
    setErrors({});
    
    // Validate form
    const newErrors: {
      position?: string;
    } = {};
    
    if (!position.trim()) {
      newErrors.position = "Camera position is required";
    }
    
    // If masking is enabled but no edges defined, show warning
    if (enableMasking && maskingEdges.length < 3) {
      newErrors.position = "Please configure masking with at least 3 points";
    }
    
    // If there are errors, update state and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit the form with masking edges if masking is enabled
    onUpdate(
      config.cameraId,
      position,
      enableHeatmap,
      enableInterpolation,
      enableMasking,
      enableMasking ? maskingEdges : undefined
    );
    
    // Close dialog
    onClose();
  };
  
  // Handle opening masking editor
  const handleOpenMaskingEditor = () => {
    if (!availableCamera) return;
    setMaskingEditorOpen(true);
  };
  
  // Handle saving masking configuration
  const handleSaveMasking = (edges: Edge[]) => {
    setMaskingEdges(edges);
    setMaskingEditorOpen(false);
  };

  return (
    <Dialog open={isOpen && !maskingEditorOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" />
            Edit Camera Configuration
          </DialogTitle>
          <DialogDescription>
            Update the configuration for this camera in the current area.
          </DialogDescription>
        </DialogHeader>
        
        {config && availableCamera ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Camera</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{availableCamera.name}</p>
                <p className="text-sm text-gray-500">Resolution: {availableCamera.resolution[0]} × {availableCamera.resolution[1]}</p>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="camera-position" className={errors.position ? "text-red-500" : ""}>
                Camera Position
              </Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--tensora-medium)]" />
                <Input
                  id="camera-position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., left, right, ceiling, overhead"
                  className={errors.position ? "border-red-500" : ""}
                />
              </div>
              {errors.position && <p className="text-xs text-red-500">{errors.position}</p>}
            </div>
            
            <div className="grid gap-4 pt-2">
              <Label>Configuration Options</Label>
              
              <div className="flex items-center justify-between bg-[var(--tensora-light)]/5 p-3 rounded-md">
                <div>
                  <h4 className="text-sm font-medium">Enable Heatmap</h4>
                  <p className="text-xs text-gray-500">Show density visualization</p>
                </div>
                <Switch
                  checked={enableHeatmap}
                  onCheckedChange={setEnableHeatmap}
                />
              </div>
              
              <div className="flex items-center justify-between bg-[var(--tensora-light)]/5 p-3 rounded-md">
                <div>
                  <h4 className="text-sm font-medium">Enable Interpolation</h4>
                  <p className="text-xs text-gray-500">Smooth people count between frames</p>
                </div>
                <Switch
                  checked={enableInterpolation}
                  onCheckedChange={setEnableInterpolation}
                />
              </div>
              
              <div className="flex items-center justify-between bg-[var(--tensora-light)]/5 p-3 rounded-md">
                <div>
                  <h4 className="text-sm font-medium">Enable Masking</h4>
                  <p className="text-xs text-gray-500">Define specific counting regions</p>
                </div>
                <Switch
                  checked={enableMasking}
                  onCheckedChange={setEnableMasking}
                />
              </div>
              
              {enableMasking && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Masking Configuration</Label>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-[var(--tensora-medium)]"
                      onClick={handleOpenMaskingEditor}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit Masking
                    </Button>
                  </div>
                  
                  {maskingEdges.length > 0 ? (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                      <p className="text-sm text-green-700">
                        Masking configuration: {maskingEdges.length} points defined
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {config.maskingEdges === maskingEdges.length 
                          ? "Using existing masking configuration" 
                          : "Masking has been modified"}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                      <p className="text-sm text-yellow-700">
                        No masking points defined
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Click "Edit Masking" to define the counting area
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">
            Configuration data not available
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)]"
            disabled={!config || !availableCamera}
          >
            Update Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Masking Editor Modal - rendered outside the dialog */}
      {availableCamera && maskingEditorOpen && (
        <MaskingEditor
          isOpen={maskingEditorOpen}
          onClose={() => setMaskingEditorOpen(false)}
          onSave={handleSaveMasking}
          initialEdges={maskingEdges}
          resolution={availableCamera.resolution}
        />
      )}
    </Dialog>
  );
}