export const RESOURCES = {
  USER_FUNDER: 'user_funder',
  USER: 'user',
  FUNDER: 'funder',
  // add more here if needed...
};

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  SELF: 'self',
  APPROVE: 'approve',
  REJECT: 'reject',
  EXPORT: 'export',
  IMPORT: 'import',
  ASSIGN: 'assign',
};

// Generates a permission like "user_funder:create"
export const createPermission = (resource: string, action: string): string => {
  return `${resource}:${action}`;
};