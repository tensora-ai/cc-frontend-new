"use client";

import { useState, useMemo } from "react";
import { Calendar, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ControlPanelProps {
  date: Date;  // This is the date in local time
  onDateChange: (date: Date) => void;  // This should receive a date in local time
  lookbackHours: number;
  onLookbackChange: (hours: number) => void;
  onReset: () => void;
}

export function ControlPanel({
  date,
  onDateChange,
  lookbackHours,
  onLookbackChange,
  onReset
}: ControlPanelProps) { 
  // Format date as YYYY-MM-DD
  const formattedDate = useMemo(() => {
    return format(date, "yyyy-MM-dd");
  }, [date]);
  
  // State for time values - initialize with local date
  const [hour, setHour] = useState(date.getHours());
  const [minute, setMinute] = useState(Math.floor(date.getMinutes() / 5) * 5); // Round to nearest 5 minutes
  
  const handleTimeChange = (newHour: number, newMinute: number) => {
    // Create a new local date with the updated time
    const newLocalDate = new Date(date);
    newLocalDate.setHours(newHour);
    newLocalDate.setMinutes(newMinute);
    
    // Pass the local date directly to parent
    onDateChange(newLocalDate);
  };
  
  // Handle date selection in local time
  const handleSelectDate = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    // Preserve the current time with the new date
    const newLocalDate = new Date(newDate);
    newLocalDate.setHours(hour);
    newLocalDate.setMinutes(minute);
    
    // Pass the local date to parent
    onDateChange(newLocalDate);
  };
  
  // Generate hour options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minute options (0, 5, 10, ..., 55)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
  
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Date Picker */}
        <div className="flex-1">
          <Label className="text-sm mb-2 block text-gray-500">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal h-10"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formattedDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={handleSelectDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Time Picker */}
        <div className="flex-1">
          <Label className="text-sm mb-2 block text-gray-500">Time</Label>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            
            {/* Hour Selector */}
            <Select
              value={hour.toString()}
              onValueChange={(value) => {
                const newHour = parseInt(value);
                setHour(newHour);
                handleTimeChange(newHour, minute);
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((h) => (
                  <SelectItem key={h} value={h.toString()}>
                    {h.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <span>:</span>
            
            {/* Minute Selector */}
            <Select
              value={minute.toString()}
              onValueChange={(value) => {
                const newMinute = parseInt(value);
                setMinute(newMinute);
                handleTimeChange(hour, newMinute);
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Minute" />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 pt-2">
        {/* Lookback Hours Slider */}
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <Label className="text-sm text-gray-500">Lookback Period (hours)</Label>
            <span className="text-sm font-medium">{lookbackHours}</span>
          </div>
          <Slider
            value={[lookbackHours]}
            min={1}
            max={10}
            step={1}
            onValueChange={(values) => onLookbackChange(values[0])}
            className="w-full"
          />
        </div>
        
        {/* Reset Button */}
        <div className="flex items-end">
          <Button 
            variant="outline" 
            size="sm"
            className="text-[var(--tensora-medium)]"
            onClick={onReset}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
}