"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, RefreshCw, Play, Pause, Radio } from "lucide-react";
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
import { convertFromLocalTimeToUtc } from "@/lib/datetime-utils";

interface ControlPanelProps {
  date: Date;  // This is the date in local time
  onDateChange: (date: Date) => void;  // This should receive a date in local time
  lookbackHours: number;
  onLookbackChange: (hours: number) => void;
  onReset: () => void;
  onApply?: () => void;
  loading?: boolean;     // Loading state
  showApplyButton?: boolean; // Whether to show apply button
  // New live mode props
  liveMode?: boolean;
  onLiveModeChange?: (enabled: boolean) => void;
  liveModeCountdown?: number; // Seconds until next refresh
}

export function ControlPanel({
  date,
  onDateChange,
  lookbackHours,
  onLookbackChange,
  onReset,
  onApply,
  loading = false,
  showApplyButton = false,
  liveMode = false,
  onLiveModeChange,
  liveModeCountdown = 0
}: ControlPanelProps) { 
  // Format date as YYYY-MM-DD
  const formattedDate = useMemo(() => {
    return format(date, "yyyy-MM-dd");
  }, [date]);
  
  // State for time values - initialize with local date
  const [hour, setHour] = useState(date.getHours());
  const [minute, setMinute] = useState(date.getMinutes());
  
  // Sync time pickers when date changes (e.g., from reset)
  useEffect(() => {
    setHour(date.getHours());
    setMinute(date.getMinutes());
  }, [date]);
  
  const handleTimeChange = (newHour: number, newMinute: number) => {
    // Create a new local date with the updated time
    const newLocalDate = new Date(date);
    newLocalDate.setHours(newHour);
    newLocalDate.setMinutes(newMinute);
    newLocalDate.setSeconds(0); // Reset seconds to avoid issues
    newLocalDate.setMilliseconds(0); // Reset milliseconds to avoid issues
    
    // Format the date to UTC
    const newUtcDate = convertFromLocalTimeToUtc(newLocalDate);

    // Pass the local date directly to parent
    onDateChange(newUtcDate);
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
  
  // Generate minute options
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  // Handle live mode toggle
  const handleLiveModeToggle = () => {
    if (onLiveModeChange) {
      onLiveModeChange(!liveMode);
    }
  };

  // Format countdown display
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
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
                disabled={loading || liveMode}
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
              disabled={loading || liveMode}
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
              disabled={loading || liveMode}
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
            max={24}
            step={1}
            onValueChange={(values) => onLookbackChange(values[0])}
            className="w-full"
            disabled={loading || liveMode}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-end gap-2">
          {/* Live Mode Toggle */}
          {onLiveModeChange && (
            <div className="flex flex-col items-center gap-1">
              <Button 
                variant={liveMode ? "default" : "outline"}
                size="sm"
                className={liveMode ? 
                  "bg-green-600 hover:bg-green-700 text-white" : 
                  "text-green-600 border-green-600 hover:bg-green-50"
                }
                onClick={handleLiveModeToggle}
                disabled={loading}
              >
                {liveMode ? (
                  <>
                    <Radio className="h-4 w-4 mr-2 animate-pulse" /> Live
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> Live Mode
                  </>
                )}
              </Button>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-[var(--tensora-medium)]"
            onClick={onReset}
            disabled={loading || liveMode}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reset
          </Button>
          
          {showApplyButton && onApply && (
            <Button 
              size="sm"
              className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)]"
              onClick={onApply}
              disabled={loading || liveMode}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" /> Apply
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Live Mode Status Banner */}
      {liveMode && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center mr-3">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-green-700 font-medium text-sm">Live Mode Active</span>
            </div>
            <span className="text-green-600 text-sm">
              Auto-refreshing every 30 seconds
            </span>
          </div>
          <div className="text-green-700 font-mono text-sm">
            {formatCountdown(liveModeCountdown)}
          </div>
        </div>
      )}
    </div>
  );
}