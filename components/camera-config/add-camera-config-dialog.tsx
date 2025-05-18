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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Camera as CameraType, Edge, Position } from "@/models/project";
import { MaskingEditor } from "@/components/camera-config/masking-editor";

interface AddCameraConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    id: string,
    name: string,
    cameraId: string,
    position: Position,
    enableHeatmap: boolean,
    enableInterpolation: boolean,
    enableMasking: boolean,
    maskingEdges?: Edge[],
    heatmapConfig?: [number, number, number, number],
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
  const [id, setId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [positionName, setPositionName] = useState<string>("");
  const [centerGroundPlaneX, setCenterGroundPlaneX] = useState<string>("");
  const [centerGroundPlaneY, setCenterGroundPlaneY] = useState<string>("");
  const [focalLength, setFocalLength] = useState<string>("");
  
  const [enableHeatmap, setEnableHeatmap] = useState<boolean>(false);
  const [heatmapMin, setHeatmapMin] = useState<string>("0");
  const [heatmapLow, setHeatmapLow] = useState<string>("10");
  const [heatmapMedium, setHeatmapMedium] = useState<string>("20");
  const [heatmapMax, setHeatmapMax] = useState<string>("50");
  
  const [enableInterpolation, setEnableInterpolation] = useState<boolean>(false);
  const [enableMasking, setEnableMasking] = useState<boolean>(false);
  const [maskingEdges, setMaskingEdges] = useState<Edge[]>([]);
  const [maskingEditorOpen, setMaskingEditorOpen] = useState<boolean>(false);
  
  // Validation state
  const [errors, setErrors] = useState<{
    camera?: string;
    position?: string;
    centerGroundPlane?: string;
    focalLength?: string;
    heatmap?: string;
  }>({});

  // Handle form submission
  const handleSubmit = () => {
    // Reset errors
    setErrors({});
    
    // Validate form
    const newErrors: {
      camera?: string;
      position?: string;
      centerGroundPlane?: string;
      focalLength?: string;
      heatmap?: string;
    } = {};
    
    if (!selectedCameraId) {
      newErrors.camera = "Camera selection is required";
    }
    
    if (!positionName.trim()) {
      newErrors.position = "Camera position name is required";
    }
    
    // Validate center ground plane if either X or Y is provided
    if (centerGroundPlaneX.trim() || centerGroundPlaneY.trim()) {
      const x = parseFloat(centerGroundPlaneX);
      const y = parseFloat(centerGroundPlaneY);
      
      if (isNaN(x)) {
        newErrors.centerGroundPlane = "X coordinate must be a number";
      } else if (centerGroundPlaneY.trim() && isNaN(y)) {
        newErrors.centerGroundPlane = "Y coordinate must be a number";
      }
    }
    
    // Validate focal length if provided
    if (focalLength.trim()) {
      const f = parseFloat(focalLength);
      if (isNaN(f) || f <= 0) {
        newErrors.focalLength = "Focal length must be a positive number";
      }
    }
    
    // Validate heatmap config if enabled
    if (enableHeatmap) {
      const min = parseFloat(heatmapMin);
      const low = parseFloat(heatmapLow);
      const medium = parseFloat(heatmapMedium);
      const max = parseFloat(heatmapMax);
      
      if (isNaN(min) || isNaN(low) || isNaN(medium) || isNaN(max)) {
        newErrors.heatmap = "All heatmap values must be numbers";
      }
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
    
    // Create position object
    const position: Position = {
      name: positionName,
    };
    
    // Add optional position properties if provided
    if (centerGroundPlaneX.trim() && centerGroundPlaneY.trim()) {
      position.center_ground_plane = [
        parseFloat(centerGroundPlaneX),
        parseFloat(centerGroundPlaneY)
      ];
    }
    
    if (focalLength.trim()) {
      position.focal_length = parseFloat(focalLength);
    }
    
    // Create heatmap config if enabled
    let heatmapConfig: [number, number, number, number] | undefined = undefined;
    if (enableHeatmap) {
      heatmapConfig = [
        parseFloat(heatmapMin),
        parseFloat(heatmapLow),
        parseFloat(heatmapMedium),
        parseFloat(heatmapMax)
      ];
    }
    
    // Submit the form
    onAdd(
      selectedCameraId,
      id,
      name,
      position,
      enableHeatmap,
      enableInterpolation,
      enableMasking,
      enableMasking ? maskingEdges : undefined,
      heatmapConfig ? heatmapConfig : undefined,
    );
    
    // Reset form
    setId("");
    setName("");
    setSelectedCameraId("");
    setPositionName("");
    setCenterGroundPlaneX("");
    setCenterGroundPlaneY("");
    setFocalLength("");
    setEnableHeatmap(false);
    setHeatmapMin("0");
    setHeatmapLow("10");
    setHeatmapMedium("20");
    setHeatmapMax("50");
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
      setPositionName("");
      setCenterGroundPlaneX("");
      setCenterGroundPlaneY("");
      setFocalLength("");
      setEnableHeatmap(false);
      setHeatmapMin("0");
      setHeatmapLow("10");
      setHeatmapMedium("20");
      setHeatmapMax("50");
      setEnableInterpolation(false);
      setEnableMasking(false);
      setMaskingEdges([]);
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen && !maskingEditorOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" />
            Add Camera Configuration
          </DialogTitle>
          <DialogDescription>
            Configure a camera for this area. You can customize position, heatmap, interpolation, and masking features.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="pt-4">
            <div className="grid gap-4">
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
                <Label htmlFor="position-name" className={errors.position ? "text-red-500" : ""}>
                  Position Name
                </Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--tensora-medium)]" />
                  <Input
                    id="position-name"
                    value={positionName}
                    onChange={(e) => setPositionName(e.target.value)}
                    placeholder="e.g., left, right, ceiling, overhead"
                    className={errors.position ? "border-red-500" : ""}
                  />
                </div>
                {errors.position && <p className="text-xs text-red-500">{errors.position}</p>}
                <p className="text-xs text-gray-500">
                  Describe the position or angle of the camera in this area
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="position" className="pt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className={errors.centerGroundPlane ? "text-red-500" : ""}>
                  Center Ground Plane (optional)
                </Label>
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 mb-1">X</span>
                    <Input
                      value={centerGroundPlaneX}
                      onChange={(e) => setCenterGroundPlaneX(e.target.value)}
                      type="number"
                      step="0.1"
                      className={errors.centerGroundPlane ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 mb-1">Y</span>
                    <Input
                      value={centerGroundPlaneY}
                      onChange={(e) => setCenterGroundPlaneY(e.target.value)}
                      type="number"
                      step="0.1"
                      className={errors.centerGroundPlane ? "border-red-500" : ""}
                    />
                  </div>
                </div>
                {errors.centerGroundPlane && <p className="text-xs text-red-500">{errors.centerGroundPlane}</p>}
                <p className="text-xs text-gray-500">
                  The center point of the ground plane in world coordinates
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label className={errors.focalLength ? "text-red-500" : ""}>
                  Focal Length (optional)
                </Label>
                <Input
                  value={focalLength}
                  onChange={(e) => setFocalLength(e.target.value)}
                  type="number"
                  step="0.0001"
                  min="0.001"
                  placeholder="e.g., 0.008"
                  className={errors.focalLength ? "border-red-500" : ""}
                />
                {errors.focalLength && <p className="text-xs text-red-500">{errors.focalLength}</p>}
                <p className="text-xs text-gray-500">
                  Focal length of the camera lens in meters
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="pt-4">
            <div className="grid gap-4">
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
              
              {enableHeatmap && (
                <div className="ml-4 border-l-2 border-[var(--tensora-light)]/20 pl-4">
                  <Label className={`mb-1 block text-sm ${errors.heatmap ? "text-red-500" : ""}`}>
                    Heatmap Configuration
                  </Label>
                  <div className="grid grid-cols-4 gap-2 mb-1">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-1">Value 1</span>
                      <Input
                        value={heatmapMin}
                        onChange={(e) => setHeatmapMin(e.target.value)}
                        type="number"
                        className={errors.heatmap ? "border-red-500" : ""}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-1">Value 2</span>
                      <Input
                        value={heatmapLow}
                        onChange={(e) => setHeatmapLow(e.target.value)}
                        type="number"
                        className={errors.heatmap ? "border-red-500" : ""}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-1">Value 3</span>
                      <Input
                        value={heatmapMedium}
                        onChange={(e) => setHeatmapMedium(e.target.value)}
                        type="number"
                        className={errors.heatmap ? "border-red-500" : ""}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-1">Value 4</span>
                      <Input
                        value={heatmapMax}
                        onChange={(e) => setHeatmapMax(e.target.value)}
                        type="number"
                        className={errors.heatmap ? "border-red-500" : ""}
                      />
                    </div>
                  </div>
                  {errors.heatmap && <p className="text-xs text-red-500 mb-2">{errors.heatmap}</p>}
                  <p className="text-xs text-gray-500 mb-2">
                    Heatmap configuration parameters
                  </p>
                </div>
              )}
              
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
                        Click &ldquo;Configure Masking&rdquo; to define the counting area
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
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