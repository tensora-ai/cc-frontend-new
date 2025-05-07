"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DeleteCameraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cameraName: string;
  hasConfigurations: boolean;
}

export function DeleteCameraDialog({
  isOpen,
  onClose,
  onConfirm,
  cameraName,
  hasConfigurations
}: DeleteCameraDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete Camera
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasConfigurations ? (
              <>
                <p className="mb-2">
                  This camera is currently being used in one or more monitoring areas.
                </p>
                <p className="font-medium text-red-600">
                  Deleting <span className="font-bold">{cameraName}</span> will also remove all its configurations from any areas.
                </p>
              </>
            ) : (
              <p>
                Are you sure you want to delete <span className="font-medium">{cameraName}</span>? This action cannot be undone.
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
            Delete Camera
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}