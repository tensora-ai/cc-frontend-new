"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (id: string, name: string) => void;
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  onCreateProject
}: CreateProjectDialogProps) {
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [idError, setIdError] = useState("");
  const [nameError, setNameError] = useState("");

  const handleSubmit = () => {
    // Reset error states
    setIdError("");
    setNameError("");
    
    // Validate inputs
    let hasError = false;
    
    if (!projectId.trim()) {
      setIdError("Project ID is required");
      hasError = true;
    } else if (!/^[a-z0-9-]+$/.test(projectId)) {
      setIdError("Project ID must contain only lowercase letters, numbers, and hyphens");
      hasError = true;
    }
    
    if (!projectName.trim()) {
      setNameError("Project name is required");
      hasError = true;
    }
    
    if (hasError) return;
    
    // Create the project
    onCreateProject(projectId, projectName);
    
    // Reset form and close dialog
    setProjectId("");
    setProjectName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter the details for your new project. You can add cameras and areas later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-id" className="text-left">
              Project ID
            </Label>
            <Input
              id="project-id"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="my-project-id"
              className={idError ? "border-red-500" : ""}
            />
            {idError && (
              <p className="text-sm text-red-500">{idError}</p>
            )}
            <p className="text-sm text-gray-500">
              Use lowercase letters, numbers, and hyphens only
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="project-name" className="text-left">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Project Name"
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <p className="text-sm text-red-500">{nameError}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}