import React from "react";
import { PlusCircle, Clock, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountingModel, ModelSchedule } from "@/models/project";

interface ModelSchedulerProps {
    defaultModel: CountingModel;
    schedules: ModelSchedule[];
    onDefaultModelChange: (model: CountingModel) => void;
    onSchedulesChange: (schedules: ModelSchedule[]) => void;
}

export function ModelScheduler({
    defaultModel,
    schedules,
    onDefaultModelChange,
    onSchedulesChange,
}: ModelSchedulerProps) {
    // Generate unique ID for new schedules
    const generateId = () => `schedule_${Date.now()}`;

    // Add a new schedule
    const handleAddSchedule = () => {
        const newSchedule: ModelSchedule = {
            id: generateId(),
            name: `Schedule ${schedules.length + 1}`,
            start: { hour: 18, minute: 0, second: 0 },
            end: { hour: 22, minute: 0, second: 0 },
            model: CountingModel.ModelNWPU,
        };

        onSchedulesChange([...schedules, newSchedule]);
    };

    // Update a schedule
    const handleUpdateSchedule = (id: string, field: string, value: string) => {
        const updatedSchedules = schedules.map(schedule => {
            if (schedule.id === id) {
                if (field === 'name') {
                    return { ...schedule, name: value };
                } else if (field === 'model') {
                    return { ...schedule, model: value as CountingModel };
                } else if (field === 'startHour') {
                    return { ...schedule, start: { ...schedule.start, hour: parseInt(value) } };
                } else if (field === 'startMinute') {
                    return { ...schedule, start: { ...schedule.start, minute: parseInt(value) } };
                } else if (field === 'startSecond' ) {
                    return { ...schedule, start: { ...schedule.start, second: parseInt(value) } };
                } else if (field === 'endHour') {
                    return { ...schedule, end: { ...schedule.end, hour: parseInt(value) } };
                } else if (field === 'endMinute') {
                    return { ...schedule, end: { ...schedule.end, minute: parseInt(value) } };
                } else if (field === 'endSecond') {
                    return { ...schedule, end: { ...schedule.end, second: parseInt(value) } };
                }
            }
            return schedule;
        });

        onSchedulesChange(updatedSchedules);
    };

    // Delete a schedule
    const handleDeleteSchedule = (id: string) => {
        onSchedulesChange(schedules.filter(schedule => schedule.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Default Counting Model</Label>
                <Select
                    value={defaultModel}
                    onValueChange={(value) => onDefaultModelChange(value as CountingModel)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={CountingModel.Model0725}>Standard (model_0725.pth)</SelectItem>
                        <SelectItem value={CountingModel.ModelNWPU}>Low Light (model_nwpu.pth)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                    This model will be used when no other time-based models are active
                </p>
            </div>

            <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <Label>Time-Based Model Schedules</Label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddSchedule}
                        className="text-[var(--tensora-medium)]"
                    >
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Schedule
                    </Button>
                </div>

                {schedules.length === 0 ? (
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md text-center">
                        No time-based schedules configured.
                        <br />
                        The default model will be used at all times.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="border rounded-md p-3 bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <Input
                                            value={schedule.name}
                                            onChange={(e) => handleUpdateSchedule(schedule.id, 'name', e.target.value)}
                                            className="font-medium text-[var(--tensora-dark)] mb-1"
                                            placeholder="Schedule name"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                        className="text-gray-500 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <Label className="mb-1 block text-xs">Start Time</Label>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                                            <Input
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={schedule.start.hour}
                                                onChange={(e) => handleUpdateSchedule(schedule.id, 'startHour', e.target.value)}
                                                className="w-16 text-sm"
                                            />
                                            <span>:</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={schedule.start.minute}
                                                onChange={(e) => handleUpdateSchedule(schedule.id, 'startMinute', e.target.value)}
                                                className="w-16 text-sm"
                                            />
                                            <span>:</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={schedule.start.second}
                                                onChange={(e) => handleUpdateSchedule(schedule.id, 'startSecond', e.target.value)}
                                                className="w-16 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="mb-1 block text-xs">End Time</Label>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                                            <Input
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={schedule.end.hour}
                                                onChange={(e) => handleUpdateSchedule(schedule.id, 'endHour', e.target.value)}
                                                className="w-16 text-sm"
                                            />
                                            <span>:</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={schedule.end.minute}
                                                onChange={(e) => handleUpdateSchedule(schedule.id, 'endMinute', e.target.value)}
                                                className="w-16 text-sm"
                                            />
                                            <span>:</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={schedule.end.second}
                                                onChange={(e) => handleUpdateSchedule(schedule.id, 'endSecond', e.target.value)}
                                                className="w-16 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-1 block text-xs">Model to Use</Label>
                                    <Select
                                        value={schedule.model}
                                        onValueChange={(value) => handleUpdateSchedule(schedule.id, 'model', value)}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Select a model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={CountingModel.Model0725}>Standard (model_0725.pth)</SelectItem>
                                            <SelectItem value={CountingModel.ModelNWPU}>Low Light (model_nwpu.pth)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}