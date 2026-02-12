/**
 * Day mapping where 1 = Sunday, 2 = Monday, etc.
 */

export type DayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DAY_MAPPING = {
  1: 'Sunday',
  2: 'Monday', 
  3: 'Tuesday',
  4: 'Wednesday',
  5: 'Thursday',
  6: 'Friday',
  7: 'Saturday',
} as const;

export const DAY_MAPPING_SHORT = {
  1: 'Sun',
  2: 'Mon',
  3: 'Tue', 
  4: 'Wed',
  5: 'Thu',
  6: 'Fri',
  7: 'Sat',
} as const;

export const DAY_MAPPING_ABBR = {
  1: 'S',
  2: 'M',
  3: 'T',
  4: 'W', 
  5: 'T',
  6: 'F',
  7: 'S',
} as const;

// Reverse mapping: day name to number
export const DAY_NAME_TO_NUMBER = {
  'Sunday': 1,
  'Monday': 2,
  'Tuesday': 3,
  'Wednesday': 4,
  'Thursday': 5,
  'Friday': 6,
  'Saturday': 7,
} as const;

// Utility functions
export const getDayName = (dayNumber: DayNumber): string => {
  return DAY_MAPPING[dayNumber];
};

export const getDayShortName = (dayNumber: DayNumber): string => {
  return DAY_MAPPING_SHORT[dayNumber];
};

export const getDayAbbr = (dayNumber: DayNumber): string => {
  return DAY_MAPPING_ABBR[dayNumber];
};

export const getDayNumber = (dayName: keyof typeof DAY_NAME_TO_NUMBER): DayNumber => {
  return DAY_NAME_TO_NUMBER[dayName];
};

// Convert JavaScript Date.getDay() (0=Sunday) to our format (1=Sunday)
export const jsDateDayToOurFormat = (jsDay: number): DayNumber => {
  return (jsDay + 1) as DayNumber;
};

// Convert our format (1=Sunday) to JavaScript Date.getDay() (0=Sunday)
export const ourFormatToJsDateDay = (ourDay: DayNumber): number => {
  return ourDay - 1;
};

// Get all day numbers as array
export const ALL_DAY_NUMBERS: DayNumber[] = [1, 2, 3, 4, 5, 6, 7];

// Get all day names as array
export const ALL_DAY_NAMES = Object.values(DAY_MAPPING);

// Check if a number is a valid day number
export const isValidDayNumber = (day: number): day is DayNumber => {
  return day >= 1 && day <= 7 && Number.isInteger(day);
};

// Get weekdays only (Monday-Friday)
export const WEEKDAYS: DayNumber[] = [2, 3, 4, 5, 6];

// Get weekend days (Saturday-Sunday)
export const WEEKEND_DAYS: DayNumber[] = [1, 7];

// Check if a day is a weekday
export const isWeekday = (dayNumber: DayNumber): boolean => {
  return WEEKDAYS.includes(dayNumber);
};

// Check if a day is a weekend
export const isWeekend = (dayNumber: DayNumber): boolean => {
  return WEEKEND_DAYS.includes(dayNumber);
};
