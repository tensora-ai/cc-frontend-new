"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DeleteAreaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  areaName: string;
  hasCameraConfigs: boolean;
  cameraConfigCount: number;
}

export function DeleteAreaDialog({
  isOpen,
  onClose,
  onConfirm,
  areaName,
  hasCameraConfigs,
  cameraConfigCount
}: DeleteAreaDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete Monitoring Area
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasCameraConfigs ? (
              <>
                <p className="mb-2">
                  This area has {cameraConfigCount} camera {cameraConfigCount === 1 ? 'configuration' : 'configurations'}.
                </p>
                <p className="font-medium text-red-600">
                  Deleting <span className="font-bold">{areaName}</span> will permanently remove all its camera configurations.
                </p>
              </>
            ) : (
              <p>
                Are you sure you want to delete <span className="font-medium">{areaName}</span>? This action cannot be undone.
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
            Delete Area
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}