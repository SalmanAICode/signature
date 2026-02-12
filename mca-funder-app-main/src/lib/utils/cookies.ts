// import Cookies from 'js-cookie';

// export interface TableSettings {
//   visibleColumns: string[];
//   columnOrder: string[];
// }

// export const TABLE_SETTINGS_COOKIE_PREFIX = 'table_settings_';

// export const getTableSettings = (tableId: string): TableSettings | null => {
//   const cookieValue = Cookies.get(`${TABLE_SETTINGS_COOKIE_PREFIX}${tableId}`);
//   if (!cookieValue) return null;
  
//   try {
//     return JSON.parse(cookieValue);
//   } catch (error) {
//     console.error('Error parsing table settings cookie:', error);
//     return null;
//   }
// };

// export const setTableSettings = (tableId: string, settings: TableSettings): void => {
//   Cookies.set(`${TABLE_SETTINGS_COOKIE_PREFIX}${tableId}`, JSON.stringify(settings), {
//     expires: 365, // Store for 1 year
//     path: '/',
//   });
// };

// export const updateTableSettings = (
//   tableId: string,
//   updates: Partial<TableSettings>
// ): TableSettings => {
//   const currentSettings = getTableSettings(tableId) || {
//     visibleColumns: [],
//     columnOrder: [],
//   };

//   const newSettings = {
//     ...currentSettings,
//     ...updates,
//   };

//   setTableSettings(tableId, newSettings);
//   return newSettings;
// }; 