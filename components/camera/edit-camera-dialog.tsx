"use client";

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

interface EditCameraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, name: string, resolution: [number, number]) => void;
  camera: {
    id: string;
    name: string;
    resolution: [number, number];
  } | null;
}

export function EditCameraDialog({ isOpen, onClose, onUpdate, camera }: EditCameraDialogProps) {
  // Form state
  const [cameraName, setCameraName] = useState("");
  const [resolutionWidth, setResolutionWidth] = useState("");
  const [resolutionHeight, setResolutionHeight] = useState("");
  
  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    resolution?: string;
  }>({});

  // Update form when camera changes
  useEffect(() => {
    if (camera) {
      setCameraName(camera.name);
      setResolutionWidth(camera.resolution[0].toString());
      setResolutionHeight(camera.resolution[1].toString());
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
    
    // If there are errors, update state and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit the form
    onUpdate(camera.id, cameraName, [width, height]);
    
    // Close dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" />
            Edit Camera
          </DialogTitle>
          <DialogDescription>
            Update the details for this camera.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
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