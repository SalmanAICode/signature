import { User } from '@/types/user';

// Returns true if the user has the permission
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user || !user.permission_list) return false;
  return user.permission_list.includes(permission);
} 