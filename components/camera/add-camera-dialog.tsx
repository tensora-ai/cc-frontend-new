"use client";

import { useState } from "react";
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

interface AddCameraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (id: string, name: string, resolution: [number, number]) => void;
}

export function AddCameraDialog({ isOpen, onClose, onAdd }: AddCameraDialogProps) {
  // Form state
  const [cameraId, setCameraId] = useState("");
  const [cameraName, setCameraName] = useState("");
  const [resolutionWidth, setResolutionWidth] = useState("");
  const [resolutionHeight, setResolutionHeight] = useState("");
  
  // Validation state
  const [errors, setErrors] = useState<{
    id?: string;
    name?: string;
    resolution?: string;
  }>({});

  // Handle form submission
  const handleSubmit = () => {
    // Reset errors
    setErrors({});
    
    // Validate form
    const newErrors: {
      id?: string;
      name?: string;
      resolution?: string;
    } = {};
    
    if (!cameraId.trim()) {
      newErrors.id = "Camera ID is required";
    } else if (!/^[a-z0-9_]+$/.test(cameraId)) {
      newErrors.id = "ID can only contain lowercase letters, numbers, and underscores";
    }
    
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
    onAdd(cameraId, cameraName, [width, height]);
    
    // Reset form
    setCameraId("");
    setCameraName("");
    setResolutionWidth("");
    setResolutionHeight("");
    
    // Close dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" />
            Add New Camera
          </DialogTitle>
          <DialogDescription>
            Add a new camera to your inventory. You'll be able to configure it in monitoring areas later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="camera-id" className={errors.id ? "text-red-500" : ""}>
              Camera ID
            </Label>
            <Input
              id="camera-id"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              placeholder="test_camera"
              className={errors.id ? "border-red-500" : ""}
            />
            {errors.id && <p className="text-xs text-red-500">{errors.id}</p>}
            <p className="text-xs text-gray-500">
              Use lowercase letters, numbers, and underscores only
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
              placeholder="Test Camera"
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
                placeholder="Width"
                type="number"
                min="1"
                className={errors.resolution ? "border-red-500" : ""}
              />
              <span>×</span>
              <Input
                value={resolutionHeight}
                onChange={(e) => setResolutionHeight(e.target.value)}
                placeholder="Height"
                type="number"
                min="1"
                className={errors.resolution ? "border-red-500" : ""}
              />
            </div>
            {errors.resolution && <p className="text-xs text-red-500">{errors.resolution}</p>}
            <p className="text-xs text-gray-500">
              Enter the resolution in pixels (e.g., 1920 × 1080)
            </p>
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
            Add Camera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}