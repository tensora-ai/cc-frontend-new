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
 */
export const convertFromUtcToLocalTime = (date: Date | string): Date => {
  console.log("Converting date from UTC to local time:", date);
  
  // Get the local timezone
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // toZonedTime takes a UTC date and returns a Date that represents
  // the equivalent local time in the specified timezone
  return toZonedTime(date, localTimeZone);
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