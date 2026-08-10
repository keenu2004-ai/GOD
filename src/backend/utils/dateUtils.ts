import dotenv from 'dotenv';
dotenv.config();

/**
 * Returns the current business date string (YYYY-MM-DD) based on the application's configured timezone.
 * Defaults to 'Asia/Kolkata' if APP_TIMEZONE is not set in .env.
 */
export function getAppBusinessDate(date: Date = new Date()): string {
  const timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Parses a given date string into a Date object representing the start of the day in the application timezone.
 */
export function getAppBusinessDateStart(dateStr: string): Date {
  // Simple mapping, creating a Date object at midnight local time usually suffices for DB storage 
  // since PostgreSQL timestamp without timezone stores the exact string.
  return new Date(`${dateStr}T00:00:00.000`);
}
