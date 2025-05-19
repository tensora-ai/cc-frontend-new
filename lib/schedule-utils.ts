import { ModelSchedule, TimeAtDay } from "@/models/project";

// Helper function to check for overlapping schedules
export const checkScheduleOverlaps = (schedules: ModelSchedule[]): { hasOverlap: boolean; conflictInfo?: string } => {
  for (let i = 0; i < schedules.length; i++) {
    const scheduleA = schedules[i];
    
    // Convert to seconds for easier comparison
    const startA = scheduleA.start.hour * 3600 + scheduleA.start.minute * 60 + scheduleA.start.second;
    const endA = scheduleA.end.hour * 3600 + scheduleA.end.minute * 60 + scheduleA.end.second;
    const isOvernightA = endA <= startA;

    for (let j = i + 1; j < schedules.length; j++) {
      const scheduleB = schedules[j];
      
      // Convert to seconds
      const startB = scheduleB.start.hour * 3600 + scheduleB.start.minute * 60 + scheduleB.start.second;
      const endB = scheduleB.end.hour * 3600 + scheduleB.end.minute * 60 + scheduleB.end.second;
      const isOvernightB = endB <= startB;
      
      // Format times for error message
      const formatTime = (t: TimeAtDay) => 
        `${t.hour.toString().padStart(2, '0')}:${t.minute.toString().padStart(2, '0')}`;
      
      // Check for overlap
      let hasOverlap = false;
      
      if (isOvernightA && isOvernightB) {
        // Both schedules span midnight - they always overlap
        hasOverlap = true;
      } else if (isOvernightA) {
        // Schedule A spans midnight, B doesn't
        hasOverlap = startB < endA || endB > startA;
      } else if (isOvernightB) {
        // Schedule B spans midnight, A doesn't
        hasOverlap = startA < endB || endA > startB;
      } else {
        // Neither schedule spans midnight - normal comparison
        hasOverlap = startA < endB && endA > startB;
      }
      
      if (hasOverlap) {
        return {
          hasOverlap: true,
          conflictInfo: `"${scheduleA.name}" (${formatTime(scheduleA.start)}-${formatTime(scheduleA.end)}) overlaps with "${scheduleB.name}" (${formatTime(scheduleB.start)}-${formatTime(scheduleB.end)})`
        };
      }
    }
  }
  
  return { hasOverlap: false };
};