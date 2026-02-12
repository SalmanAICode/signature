/**
 * Converts an ISO date string to YYYY-MM-DD format for HTML date inputs
 * @param isoDateString - ISO date string like "2025-06-02T22:00:44.053Z"
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export function formatDateForInput(isoDateString: string | undefined | null): string {
  if (!isoDateString) return '';
  
  try {
    const date = new Date(isoDateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Gets current date in YYYY-MM-DD format
 * @returns Current date string in YYYY-MM-DD format
 */
export function getCurrentDateForInput(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Converts an ISO date string to a localized date string
 * @param isoDateString - ISO date string like "2025-06-02T22:00:44.053Z"
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(isoDateString: string | undefined | null): string {
  if (!isoDateString) return 'N/A';
  
  try {
    const date = new Date(isoDateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Format for display (you can customize this format)
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return 'Invalid Date';
  }
} 