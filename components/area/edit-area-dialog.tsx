"use client";

import { useState, useEffect } from "react";
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

interface EditAreaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, name: string) => void;
  area: {
    id: string;
    name: string;
  } | null;
}

export function EditAreaDialog({ isOpen, onClose, onUpdate, area }: EditAreaDialogProps) {
  // Form state
  const [areaName, setAreaName] = useState("");
  
  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
  }>({});

  // Update form when area changes
  useEffect(() => {
    if (area) {
      setAreaName(area.name);
    }
  }, [area]);

  // Handle form submission
  const handleSubmit = () => {
    if (!area) return;
    
    // Reset errors
    setErrors({});
    
    // Validate form
    const newErrors: {
      name?: string;
    } = {};
    
    if (!areaName.trim()) {
      newErrors.name = "Area name is required";
    }
    
    // If there are errors, update state and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit the form
    onUpdate(area.id, areaName);
    
    // Close dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Map className="mr-2 h-5 w-5 text-[var(--tensora-medium)]" />
            Edit Monitoring Area
          </DialogTitle>
          <DialogDescription>
            Update the details for this monitoring area.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Area ID</Label>
            <Input
              value={area?.id || ""}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Area ID cannot be changed
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
            Update Area
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}