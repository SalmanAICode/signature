import { User } from '@/types/user';
import apiClient from './client';
import useAuthStore from '@/lib/store/auth';
import { env } from '@/config/env';
import { ApiListResponse } from '@/types/api';


interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
}

interface UserData {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
  phone_work?: string;
  created_date: string;
  updated_date: string;
  online: boolean;
  inactive: boolean;
  __v?: number;
  last_login?: string;
  permission_list?: string[];
  type?: 'funder_manager' | 'funder_user' | string;
  id?: string;
}

type GetUserParams = {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  search?: string;
};

export const getUsers = async ({
  sortBy,
  sortOrder,
  page = 1,
  limit = 10,
  include_inactive = false,
  search = "",
}: GetUserParams): Promise<{ data: User[], pagination: any }> => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    include_inactive: String(include_inactive),
    search: search || "",
  });
  if (sortBy && sortOrder) {
    query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
  }
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  const response = await apiClient.get<{ success: boolean; message?: string; data: { docs: User[]; pagination: any } }>(
    `/users?${query.toString()}`,
    true,
    accessToken
  );
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch users');
  }
  return {
    data: response.data.docs,
    pagination: response.data.pagination,
  };
};

type CreateUserData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
  password: string;
};

type CreateUserResponse = {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: any;
};

type PasswordResponse = {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: any;
};

export async function createUser(userData: CreateUserData): Promise<CreateUserResponse> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.post<ApiResponse<any>>('/users', userData, true, accessToken);

    return {
      success: response.success,
      message: response.message,
      statusCode: response.statusCode,
      data: response.data
    };
  } catch (error) {
    throw error;
  }
}

type UpdateUserData = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_mobile?: string;
  inactive?: boolean;
};

export async function updateUser(userId: string, userData: UpdateUserData): Promise<CreateUserResponse> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.put<ApiResponse<any>>(`/users/${userId}`, userData, true, accessToken);

    return {
      success: true,
      message: 'User updated successfully',
      statusCode: 200,
      data: response.data
    };
  } catch (error) {
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<CreateUserResponse> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.delete<ApiResponse<any>>(`/users/${userId}`, true, accessToken);

    return {
      success: true,
      message: 'User deleted successfully',
      statusCode: 200,
      data: response.data
    };
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUser(): Promise<UserData> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  const response = await apiClient.get<ApiResponse<UserData>>('/users/me', true, accessToken);
  if (!response.success) throw new Error(response.message || 'Failed to fetch user info');
  return response.data;
}

export async function getUser(userId: string): Promise<ApiResponse<UserData>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.get<ApiResponse<UserData>>(`/users/${userId}`, true, accessToken);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch user');
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function getMe(): Promise<ApiResponse<UserData>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.get<ApiResponse<UserData>>(`/users/me`, true, accessToken);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch me');
    }

    return response;
  } catch (error) {
    throw error;
  }
}


export async function updateDetails(userData: UpdateUserData): Promise<CreateUserResponse> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.put<ApiResponse<any>>(`/users/updatedetails`, userData, true, accessToken);

    return {
      success: true,
      message: 'User updated successfully',
      statusCode: 200,
      data: response.data
    };
  } catch (error) {
    throw error;
  }
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<PasswordResponse> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.put<ApiResponse<any>>(`/users/updatepassword`, { currentPassword, newPassword }, true, accessToken);
    return {
      success: response.success,
      message: response.message,
      statusCode: response.statusCode,
      data: response.data
    };
  } catch (error) {
    throw error;
  }
}


export async function getUserFunders(userId: string): Promise<ApiResponse<any>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.get<ApiResponse<any>>(`/users/${userId}/funders`, true, accessToken);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function addUserFunder(userId: string, funderId: string): Promise<ApiResponse<any>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.post<ApiResponse<any>>(
      `/users/${userId}/funders`,
      { funder: funderId },
      true,
      accessToken
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function removeUserFunder(userId: string, funderId: string): Promise<ApiResponse<any>> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.delete<ApiResponse<any>>(
      `/users/${userId}/funders/${funderId}`,
      true,
      accessToken
    );
    return response;
  } catch (error) {
    throw error;
  }
}


export type getUserListQueryParams = {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  include_inactive?: boolean;
  funder?: string;
}


export async function getUserList(params: getUserListQueryParams): Promise<User[]> {

  const query = new URLSearchParams({
    include_inactive: params.include_inactive ? 'true' : 'false',
  });

  if (params.funder) {
    query.append('funder', params.funder);
  }

  if (params.sortBy) {
    query.append('sort', params.sortBy);
  }

  if (params.sortOrder) {
    query.append('sortOrder', params.sortOrder);
  }
  
  const result = await apiClient.get<ApiListResponse<User>>(`${env.api.endpoints.user.getUserList}?${query.toString()}`);
  return result.data;
}
