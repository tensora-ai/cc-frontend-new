import { Settings, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CountingModel, ModelSchedule } from "@/models/project";

interface CameraCardProps {
  id: string;
  name: string;
  resolution: [number, number];
  defaultModel?: CountingModel;
  modelSchedules?: ModelSchedule[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CameraCard({
  id,
  name,
  resolution,
  defaultModel,
  modelSchedules = [],
  onEdit,
  onDelete
}: CameraCardProps) {
  const getModelName = (model: CountingModel) => {
    return model === CountingModel.Model0725 ? "Standard" : "Low Light";
  };

  const hasSchedules = modelSchedules && modelSchedules.length > 0;

  return (
    <Card className="overflow-hidden hover:border-[var(--tensora-medium)] transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
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
        </div>

        {defaultModel && (
          <div className="mt-2 text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-600">Model:</span>
                <span className="px-2 py-0.5 bg-[var(--tensora-light)]/10 rounded text-xs">
                  {getModelName(defaultModel)}
                </span>
              </div>

              {hasSchedules && (
                <div className="flex items-center text-gray-500 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{modelSchedules.length} schedule{modelSchedules.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}