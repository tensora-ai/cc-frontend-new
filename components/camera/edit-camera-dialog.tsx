import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
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
import { ModelScheduler } from "@/components/camera/model-scheduler";
import { CountingModel, ModelSchedule } from "@/models/project";

interface EditCameraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    name: string,
    resolution: [number, number],
    defaultModel: CountingModel,
    sensorSize?: [number, number],
    coordinates3d?: [number, number, number],
    modelSchedules?: ModelSchedule[]
  ) => void;
  camera: {
    id: string;
    name: string;
    resolution: [number, number];
    sensor_size?: [number, number];
    coordinates_3d?: [number, number, number];
    default_model?: CountingModel;
    model_schedules?: ModelSchedule[];
  } | null;
}

export function EditCameraDialog({ isOpen, onClose, onUpdate, camera }: EditCameraDialogProps) {
  // Basic camera info
  const [cameraName, setCameraName] = useState("");

  // Resolution
  const [resolutionWidth, setResolutionWidth] = useState("");
  const [resolutionHeight, setResolutionHeight] = useState("");

  // Optional properties
  const [sensorWidth, setSensorWidth] = useState("");
  const [sensorHeight, setSensorHeight] = useState("");
  const [coordX, setCoordX] = useState("");
  const [coordY, setCoordY] = useState("");
  const [coordZ, setCoordZ] = useState("");

  // Model scheduling
  const [defaultModel, setDefaultModel] = useState<CountingModel>(CountingModel.Model0725);
  const [modelSchedules, setModelSchedules] = useState<ModelSchedule[]>([]);

  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    resolution?: string;
    sensor?: string;
    coordinates?: string;
  }>({});

  // Update form when camera changes
  useEffect(() => {
    if (camera) {
      setCameraName(camera.name);
      setResolutionWidth(camera.resolution[0].toString());
      setResolutionHeight(camera.resolution[1].toString());

      // Set sensor size if exists
      if (camera.sensor_size) {
        setSensorWidth(camera.sensor_size[0].toString());
        setSensorHeight(camera.sensor_size[1].toString());
      } else {
        setSensorWidth("");
        setSensorHeight("");
      }

      // Set coordinates if exists
      if (camera.coordinates_3d) {
        setCoordX(camera.coordinates_3d[0].toString());
        setCoordY(camera.coordinates_3d[1].toString());
        setCoordZ(camera.coordinates_3d[2].toString());
      } else {
        setCoordX("");
        setCoordY("");
        setCoordZ("");
      }

      // Set model data if exists
      if (camera.default_model) {
        setDefaultModel(camera.default_model);
      } else {
        setDefaultModel(CountingModel.Model0725);
      }

      if (camera.model_schedules) {
        setModelSchedules(camera.model_schedules);
      } else {
        setModelSchedules([]);
      }
    }
  }, [camera]);

  // Handle form submission
  const handleSubmit = () => {
    if (!camera) return;

    // Reset errors
    setErrors({});

    // Validate form
    const newErrors: {
      name?: string;
      resolution?: string;
      sensor?: string;
      coordinates?: string;
    } = {};

    if (!cameraName.trim()) {
      newErrors.name = "Camera name is required";
    }

    const width = parseInt(resolutionWidth);
    const height = parseInt(resolutionHeight);

    if (isNaN(width) || width <= 0) {
      newErrors.resolution = "Width must be a positive number";
    } else if (isNaN(height) || height <= 0) {
      newErrors.resolution = "Height must be a positive number";
    }

    // Optional sensor size validation - if one is provided, both must be valid
    let sensorSize: [number, number] | undefined = undefined;
    if (sensorWidth.trim() || sensorHeight.trim()) {
      const sWidth = parseFloat(sensorWidth);
      const sHeight = parseFloat(sensorHeight);

      if (isNaN(sWidth) || sWidth <= 0) {
        newErrors.sensor = "Sensor width must be a positive number";
      } else if (isNaN(sHeight) || sHeight <= 0) {
        newErrors.sensor = "Sensor height must be a positive number";
      } else {
        sensorSize = [sWidth, sHeight];
      }
    }

    // Optional 3D coordinates validation - if one is provided, all must be valid
    let coordinates3d: [number, number, number] | undefined = undefined;
    if (coordX.trim() || coordY.trim() || coordZ.trim()) {
      const x = parseFloat(coordX);
      const y = parseFloat(coordY);
      const z = parseFloat(coordZ);

      if (isNaN(x)) {
        newErrors.coordinates = "X coordinate must be a number";
      } else if (isNaN(y)) {
        newErrors.coordinates = "Y coordinate must be a number";
      } else if (isNaN(z)) {
        newErrors.coordinates = "Z coordinate must be a number";
      } else {
        coordinates3d = [x, y, z];
      }
    }

    // If there are errors, update state and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit the form
    onUpdate(
      camera.id,
      cameraName,
      [width, height],
      defaultModel,
      sensorSize,
      coordinates3d,
      modelSchedules
    );

    // Close dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" />
            Edit Camera
          </DialogTitle>
          <DialogDescription>
            Update the details for this camera.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="model">Counting Model</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="pt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Camera ID</Label>
                <Input
                  value={camera?.id || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Camera ID cannot be changed
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="camera-name" className={errors.name ? "text-red-500" : ""}>
                  Camera Name
                </Label>
                <Input
                  id="camera-name"
                  value={cameraName}
                  onChange={(e) => setCameraName(e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="grid gap-2">
                <Label className={errors.resolution ? "text-red-500" : ""}>
                  Resolution
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    value={resolutionWidth}
                    onChange={(e) => setResolutionWidth(e.target.value)}
                    type="number"
                    min="1"
                    className={errors.resolution ? "border-red-500" : ""}
                  />
                  <span>×</span>
                  <Input
                    value={resolutionHeight}
                    onChange={(e) => setResolutionHeight(e.target.value)}
                    type="number"
                    min="1"
                    className={errors.resolution ? "border-red-500" : ""}
                  />
                </div>
                {errors.resolution && <p className="text-xs text-red-500">{errors.resolution}</p>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="pt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className={errors.sensor ? "text-red-500" : ""}>
                  Sensor Size (optional)
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    value={sensorWidth}
                    onChange={(e) => setSensorWidth(e.target.value)}
                    placeholder="Width"
                    type="number"
                    min="0.001"
                    step="0.001"
                    className={errors.sensor ? "border-red-500" : ""}
                  />
                  <span>×</span>
                  <Input
                    value={sensorHeight}
                    onChange={(e) => setSensorHeight(e.target.value)}
                    placeholder="Height"
                    type="number"
                    min="0.001"
                    step="0.001"
                    className={errors.sensor ? "border-red-500" : ""}
                  />
                </div>
                {errors.sensor && <p className="text-xs text-red-500">{errors.sensor}</p>}
                <p className="text-xs text-gray-500">
                  Enter the sensor size in mm or inches
                </p>
              </div>

              <div className="grid gap-2">
                <Label className={errors.coordinates ? "text-red-500" : ""}>
                  3D Coordinates (optional)
                </Label>
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 mb-1">X</span>
                    <Input
                      value={coordX}
                      onChange={(e) => setCoordX(e.target.value)}
                      type="number"
                      step="0.1"
                      className={errors.coordinates ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 mb-1">Y</span>
                    <Input
                      value={coordY}
                      onChange={(e) => setCoordY(e.target.value)}
                      type="number"
                      step="0.1"
                      className={errors.coordinates ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 mb-1">Z</span>
                    <Input
                      value={coordZ}
                      onChange={(e) => setCoordZ(e.target.value)}
                      type="number"
                      step="0.1"
                      className={errors.coordinates ? "border-red-500" : ""}
                    />
                  </div>
                </div>
                {errors.coordinates && <p className="text-xs text-red-500">{errors.coordinates}</p>}
                <p className="text-xs text-gray-500">
                  Enter the camera position in your coordinate system
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="model" className="pt-4">
            <ModelScheduler
              defaultModel={defaultModel}
              schedules={modelSchedules}
              onDefaultModelChange={setDefaultModel}
              onSchedulesChange={setModelSchedules}
            />
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
            Update Camera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}