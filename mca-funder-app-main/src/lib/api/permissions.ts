import { env } from '@/config/env';
import apiClient from './client';
import { ApiResponse } from '@/types/api';

/**
 * Check if the current user has the specified permission(s)
 * @param permission - Single permission string or array of permission strings to check
 * @returns True if user has all specified permissions, false otherwise
 */
export async function checkPermission(permission: string | string[]): Promise<boolean> {
  try {
    const endpoint = '/auth/check-permissions';
    const result = await apiClient.post<ApiResponse<boolean>>(endpoint, {
      permissions: Array.isArray(permission) ? permission : [permission]
    });
    return result.data;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}