import { DayNumber, DAY_MAPPING, DAY_MAPPING_SHORT, ALL_DAY_NUMBERS, WEEKDAYS } from '@/types/day';
import { FrequencyType } from '@/types/applicationOffer';

/**
 * Get default payday list based on frequency
 */
export const getDefaultPaydayList = (frequency: FrequencyType): DayNumber[] => {
  switch (frequency) {
    case 'DAILY':
      return WEEKDAYS; // Monday-Friday
    case 'WEEKLY':
      return [2]; // Monday
    case 'MONTHLY':
      return [1]; // 1st of month
    default:
      return [];
  }
};

/**
 * Get available days based on frequency
 */
export const getAvailableDays = (frequency: FrequencyType): { value: DayNumber; label: string }[] => {
  switch (frequency) {
    case 'DAILY':
    case 'WEEKLY':
      return ALL_DAY_NUMBERS.map(day => ({
        value: day,
        label: DAY_MAPPING[day]
      }));
    case 'MONTHLY':
      return Array.from({ length: 31 }, (_, i) => ({
        value: (i + 1) as DayNumber,
        label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`
      }));
    default:
      return [];
  }
};

/**
 * Format payday list for display
 */
export const formatPaydayList = (paydayList: DayNumber[], frequency: FrequencyType): string => {
  if (!paydayList || paydayList.length === 0) return 'No paydays specified';

  switch (frequency) {
    case 'DAILY':
      return paydayList.map(day => DAY_MAPPING_SHORT[day]).join(', ');
    case 'WEEKLY':
      return DAY_MAPPING[paydayList[0]];
    case 'MONTHLY':
      const day = paydayList[0];
      return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month`;
    default:
      return paydayList.join(', ');
  }
}; 