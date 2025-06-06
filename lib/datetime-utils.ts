import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Converts a local date to UTC
 */
export const convertFromLocalTimeToUtc = (date: Date | string): Date => {
  // Ensure we have a proper Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get the local timezone
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // fromZonedTime takes a date in the specified timezone and returns
  // the equivalent Date with UTC time internally
  return fromZonedTime(dateObj, localTimeZone);
};

/**
 * Converts a UTC date to local time
 * Fixed version that properly handles UTC ISO strings
 */
export const convertFromUtcToLocalTime = (date: Date | string): Date => {
  // Get the local timezone
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // If it's a string, ensure it's properly parsed as UTC
  let utcDate: Date;
  if (typeof date === 'string') {
    // Ensure the string is treated as UTC
    // If it doesn't end with 'Z', it might not be interpreted as UTC
    const utcString = date.endsWith('Z') ? date : date + 'Z';
    utcDate = new Date(utcString);
  } else {
    utcDate = date;
  }
  
  // toZonedTime takes a UTC date and returns a Date that represents
  // the equivalent local time in the specified timezone
  const localDate = toZonedTime(utcDate, localTimeZone);
  
  return localDate;
};

/**
 * Formats a UTC date/string to a local time string
 * This is a convenience function that combines conversion and formatting
 */
export const formatUtcToLocal = (
  date: Date | string, 
  formatString: string = 'yyyy-MM-dd HH:mm:ss'
): string => {
  try {
    // Get the local timezone
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // If it's a string, ensure it's properly parsed as UTC
    let utcDate: Date;
    if (typeof date === 'string') {
      const utcString = date.endsWith('Z') ? date : date + 'Z';
      utcDate = new Date(utcString);
    } else {
      utcDate = date;
    }
    
    // Use formatInTimeZone to format directly in the local timezone
    return formatInTimeZone(utcDate, localTimeZone, formatString);
  } catch (error) {
    console.error("Error formatting UTC to local string:", error);
    return "Invalid date";
  }
};

/**
 * Formats a UTC date to a localized display string using toLocaleString
 * This provides more flexible locale-aware formatting
 */
export const formatUtcToLocalDisplay = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    // Convert UTC to local time first
    const localDate = convertFromUtcToLocalTime(date);
    
    // Default formatting options
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Use 24-hour format by default
    };
    
    // Merge with provided options
    const formatOptions = { ...defaultOptions, ...options };
    
    // Format using toLocaleString with the local Date object
    const formatted = localDate.toLocaleString('en-US', formatOptions);
    
    return formatted;
  } catch (error) {
    console.error("Error formatting UTC to local display:", error);
    return "Invalid date";
  }
};

/**
 * Formats a date in UTC to an ISO string
 */
export const formatUtcDateToIsoString = (date: Date | string): string => {
  // Convert to UTC and return ISO string
  return convertFromLocalTimeToUtc(date).toISOString();
};

/**
 * Formats a local date to an ISO string
 */
export const formatLocalDateToIsoString = (date: Date | string): string => {
  // Ensure we have a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format in local timezone
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(dateObj, localTimeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
};

/**
 * Gets the current date and time in UTC
 */
export const getUtcNow = (): Date => {
  return new Date(new Date().toISOString());
};

/**
 * Gets the current date and time in the local timezone
 */
export const getLocalNow = (): Date => {
  return new Date();
};

/**
 * Formats a UTC ISO timestamp for blob storage paths using date-fns-tz
 * 1. Removing milliseconds (if present)
 * 2. Replacing special characters with underscores
 * 
 * @param timestamp UTC ISO timestamp string (e.g. "2023-04-01T14:30:45.000Z")
 * @returns Formatted string suitable for blob paths (e.g. "2023_04_01-14_30_45")
 */
export function formatTimestampForBlobPath(timestamp: string): string {
  // Use date-fns-tz to format the date in UTC timezone with our specific format
  return formatInTimeZone(
    timestamp,
    'UTC', // Always use UTC for blob paths
    "yyyy_MM_dd-HH_mm_ss" // Format with underscores and hyphens as needed
  );
}