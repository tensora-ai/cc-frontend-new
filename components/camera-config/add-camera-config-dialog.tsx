"use client";

import { useState } from "react";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Camera as CameraType, Edge } from "@/models/project";
import { MaskingEditor } from "@/components/camera-config/masking-editor";

interface AddCameraConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    cameraId: string,
    position: string,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean,
    maskingEdges?: Edge[]
  ) => void;
  availableCameras: CameraType[];
}

export function AddCameraConfigDialog({
  isOpen,
  onClose,
  onAdd,
  availableCameras
}: AddCameraConfigDialogProps) {
  // Form state
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [enableHeatmap, setEnableHeatmap] = useState<boolean>(false);
  const [enableInterpolation, setEnableInterpolation] = useState<boolean>(false);
  const [enableMasking, setEnableMasking] = useState<boolean>(false);
  const [maskingEdges, setMaskingEdges] = useState<Edge[]>([]);
  const [maskingEditorOpen, setMaskingEditorOpen] = useState<boolean>(false);
  
  // Validation state
  const [errors, setErrors] = useState<{
    camera?: string;
    position?: string;
  }>({});

  // Handle form submission
  const handleSubmit = () => {
    // Reset errors
    setErrors({});
    
    // Validate form
    const newErrors: {
      camera?: string;
      position?: string;
    } = {};
    
    if (!selectedCameraId) {
      newErrors.camera = "Camera selection is required";
    }
    
    if (!position.trim()) {
      newErrors.position = "Camera position is required";
    }
    
    // If masking is enabled but no edges defined, show warning
    if (enableMasking && maskingEdges.length < 3) {
      newErrors.camera = "Please configure masking with at least 3 points";
    }
    
    // If there are errors, update state and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit the form with masking edges if masking is enabled
    onAdd(
      selectedCameraId,
      position,
      enableHeatmap,
      enableInterpolation,
      enableMasking,
      enableMasking ? maskingEdges : undefined
    );
    
    // Reset form
    setSelectedCameraId("");
    setPosition("");
    setEnableHeatmap(false);
    setEnableInterpolation(false);
    setEnableMasking(false);
    setMaskingEdges([]);
    
    // Close dialog
    onClose();
  };
  
  // Handle opening masking editor
  const handleOpenMaskingEditor = () => {
    if (!selectedCameraId) {
      setErrors({ camera: "Please select a camera first to configure masking" });
      return;
    }
    
    const selectedCamera = availableCameras.find(cam => cam.id === selectedCameraId);
    if (!selectedCamera) return;
    
    // If no edges are defined yet, create a default rectangle
    if (maskingEdges.length === 0) {
      const resolution = selectedCamera.resolution;
      setMaskingEdges([
        [0, 0],
        [0, resolution[1]],
        [resolution[0], resolution[1]],
        [resolution[0], 0]
      ]);
    }
    
    setMaskingEditorOpen(true);
  };
  
  // Handle saving masking configuration
  const handleSaveMasking = (edges: Edge[]) => {
    setMaskingEdges(edges);
    setMaskingEditorOpen(false);
  };

  // Reset form when dialog opens
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset form when dialog closes
      setSelectedCameraId("");
      setPosition("");
      setEnableHeatmap(false);
      setEnableInterpolation(false);
      setEnableMasking(false);
      setMaskingEdges([]);
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen && !maskingEditorOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" />
            Add Camera Configuration
          </DialogTitle>
          <DialogDescription>
            Configure a camera for this area. You can customize heatmap, interpolation, and masking features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="camera-selection" className={errors.camera ? "text-red-500" : ""}>
              Select Camera
            </Label>
            <Select
              value={selectedCameraId}
              onValueChange={(value) => {
                setSelectedCameraId(value);
                // Reset masking edges when camera changes
                if (enableMasking) {
                  const selectedCamera = availableCameras.find(cam => cam.id === value);
                  if (selectedCamera) {
                    const resolution = selectedCamera.resolution;
                    setMaskingEdges([
                      [0, 0],
                      [0, resolution[1]],
                      [resolution[0], resolution[1]],
                      [resolution[0], 0]
                    ]);
                  }
                }
              }}
            >
              <SelectTrigger 
                className={errors.camera ? "border-red-500" : ""}
                id="camera-selection"
              >
                <SelectValue placeholder="Select a camera" />
              </SelectTrigger>
              <SelectContent>
                {availableCameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.name} ({camera.resolution[0]} × {camera.resolution[1]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.camera && <p className="text-xs text-red-500">{errors.camera}</p>}
            
            {/* Display selected camera details */}
            {selectedCameraId && (
              <div className="mt-1 text-xs text-gray-500">
                {(() => {
                  const camera = availableCameras.find(c => c.id === selectedCameraId);
                  if (camera) {
                    return `Resolution: ${camera.resolution[0]} × ${camera.resolution[1]} pixels`;
                  }
                  return null;
                })()}
              </div>
            )}
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
            <p className="text-xs text-gray-500">
              Describe the position or angle of the camera in this area
            </p>
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
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Masking Configuration</Label>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-[var(--tensora-medium)]"
                    onClick={handleOpenMaskingEditor}
                    disabled={!selectedCameraId}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Configure Masking
                  </Button>
                </div>
                
                {!selectedCameraId ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                    <p className="text-sm text-yellow-700">
                      Please select a camera first
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Camera selection is required to configure masking
                    </p>
                  </div>
                ) : maskingEdges.length > 0 ? (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                    <p className="text-sm text-green-700">
                      Masking configuration: {maskingEdges.length} points defined
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      The defined polygon will be used for counting
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                    <p className="text-sm text-yellow-700">
                      No masking points defined
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Click "Configure Masking" to define the counting area
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)]"
          >
            Add Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Render the masking editor completely outside the dialog */}
      {selectedCameraId && maskingEditorOpen && (
        <MaskingEditor
          isOpen={maskingEditorOpen}
          onClose={() => setMaskingEditorOpen(false)}
          onSave={handleSaveMasking}
          initialEdges={maskingEdges}
          resolution={availableCameras.find(cam => cam.id === selectedCameraId)?.resolution || [1920, 1080]}
        />
      )}
    </Dialog>
  );
}