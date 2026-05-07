/**
 * Checks if a date is within the last N days
 * @param dateString The date to check
 * @param days Number of days (default 7)
 * @returns boolean
 */
export const isRecent = (dateString: string | Date | null | undefined, days: number = 3): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  // A property is "new" if it was published in the last N days
  // and not in the future (to avoid timezone/server sync issues)
  return diffInDays >= 0 && diffInDays <= days;
};
