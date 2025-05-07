import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CameraCardProps {
  id: string;
  name: string;
  resolution: [number, number];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CameraCard({ id, name, resolution, onEdit, onDelete }: CameraCardProps) {
  return (
    <Card className="overflow-hidden hover:border-[var(--tensora-medium)] transition-colors">
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-[var(--tensora-dark)]">{name}</h3>
          <p className="text-sm text-gray-500">Resolution: {resolution[0]} × {resolution[1]}</p>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-[var(--tensora-medium)]"
            onClick={() => onEdit(id)}
            title="Edit Camera"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-red-600"
            onClick={() => onDelete(id)}
            title="Delete Camera"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}