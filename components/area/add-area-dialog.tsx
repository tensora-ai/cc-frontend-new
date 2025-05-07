"use client";

import { useState } from "react";
import { Map } from "lucide-react";
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

interface AddAreaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (id: string, name: string) => void;
}

export function AddAreaDialog({ isOpen, onClose, onAdd }: AddAreaDialogProps) {
  // Form state
  const [areaId, setAreaId] = useState("");
  const [areaName, setAreaName] = useState("");
  
  // Validation state
  const [errors, setErrors] = useState<{
    id?: string;
    name?: string;
  }>({});

  // Handle form submission
  const handleSubmit = () => {
    // Reset errors
    setErrors({});
    
    // Validate form
    const newErrors: {
      id?: string;
      name?: string;
    } = {};
    
    if (!areaId.trim()) {
      newErrors.id = "Area ID is required";
    } else if (!/^[a-z0-9_]+$/.test(areaId)) {
      newErrors.id = "ID can only contain lowercase letters, numbers, and underscores";
    }
    
    if (!areaName.trim()) {
      newErrors.name = "Area name is required";
    }
    
    // If there are errors, update state and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit the form
    onAdd(areaId, areaName);
    
    // Reset form
    setAreaId("");
    setAreaName("");
    
    // Close dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Map className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" />
            Add New Monitoring Area
          </DialogTitle>
          <DialogDescription>
            Create a new monitoring area. After creation, you can add camera configurations to it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="area-id" className={errors.id ? "text-red-500" : ""}>
              Area ID
            </Label>
            <Input
              id="area-id"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              placeholder="test_area"
              className={errors.id ? "border-red-500" : ""}
            />
            {errors.id && <p className="text-xs text-red-500">{errors.id}</p>}
            <p className="text-xs text-gray-500">
              Use lowercase letters, numbers, and underscores only
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="area-name" className={errors.name ? "text-red-500" : ""}>
              Area Name
            </Label>
            <Input
              id="area-name"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="Test Area"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
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
            Add Area
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}