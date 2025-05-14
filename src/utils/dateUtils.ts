export function formatTimeInTimezone(time: string, timezone: string, date?: Date): string {
  // Create a date object for today or the specified date
  const baseDate = date || new Date();
  
  // Parse the time string
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a new date with the time components
  const dateWithTime = new Date(baseDate);
  dateWithTime.setHours(hours, minutes, 0, 0);

  // Format the time in the specified timezone
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  }).format(dateWithTime);
}

export function calculatePickupAndReturnTime(
  activityTime: string,
  pickupOffset: number,
  duration: number,
  timezone: string,
  date?: Date,
  pickupWindow: number = 0
): { pickup: string; return: string } {
  // Create a date object for today or the specified date
  const baseDate = date || new Date();
  
  // Parse the activity time
  const [hours, minutes] = activityTime.split(':').map(Number);
  
  // Create Date objects for activity, pickup, and return times
  const activityDate = new Date(baseDate);
  activityDate.setHours(hours, minutes, 0, 0);
  
  // Calculate earliest pickup time (pickup offset + window)
  const earliestPickupDate = new Date(activityDate);
  earliestPickupDate.setMinutes(earliestPickupDate.getMinutes() - pickupOffset);

  // Calculate latest pickup time (pickup offset - window)
  const latestPickupDate = new Date(activityDate);
  latestPickupDate.setMinutes(latestPickupDate.getMinutes() - (pickupOffset - pickupWindow));
  
  const returnDate = new Date(activityDate);
  returnDate.setMinutes(returnDate.getMinutes() + duration);

  // Format times in the specified timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  });

  const earliestPickup = formatter.format(earliestPickupDate);
  const latestPickup = formatter.format(latestPickupDate);

  return {
    pickup: pickupWindow > 0 ? `${earliestPickup}-${latestPickup}` : earliestPickup,
    return: formatter.format(returnDate)
  };
}