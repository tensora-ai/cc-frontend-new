import { ChevronRight, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AreaCardProps {
  id: string;
  name: string;
  cameraCount: number;
  onConfigure: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AreaCard({ 
  id, 
  name, 
  cameraCount, 
  onConfigure, 
  onEdit,
  onDelete 
}: AreaCardProps) {
  return (
    <Card className="overflow-hidden hover:border-[var(--tensora-medium)] transition-colors">
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-[var(--tensora-dark)]">{name}</h3>
          <p className="text-sm text-gray-500">
            {cameraCount} {cameraCount === 1 ? 'camera' : 'cameras'} configured
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-[var(--tensora-medium)]"
            onClick={() => onEdit(id)}
            title="Edit Area"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-red-600"
            onClick={() => onDelete(id)}
            title="Delete Area"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[var(--tensora-medium)] border-[var(--tensora-medium)] ml-2"
            onClick={() => onConfigure(id)}
          >
            Configure <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}