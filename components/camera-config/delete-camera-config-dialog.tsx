"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DeleteCameraConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cameraName: string;
  position: string;
  hasMasking: boolean;
}

export function DeleteCameraConfigDialog({
  isOpen,
  onClose,
  onConfirm,
  cameraName,
  position,
  hasMasking
}: DeleteCameraConfigDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove Camera Configuration
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasMasking ? (
              <>
                <p className="mb-2">
                  This configuration includes masking settings that will be lost.
                </p>
                <p className="font-medium text-red-600">
                  Are you sure you want to remove <span className="font-bold">{cameraName}</span> ({position}) from this area?
                </p>
              </>
            ) : (
              <p>
                Are you sure you want to remove <span className="font-medium">{cameraName}</span> ({position}) from this area? This action cannot be undone.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Remove Camera
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}