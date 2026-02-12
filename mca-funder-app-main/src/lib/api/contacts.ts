import { Contact } from '@/types/contact';
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

type GetContactsParams = {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  search?: string;
};

export type CreateContactData = Omit<Contact, '_id' | 'id' | 'created_date' | 'updated_date' | 'last_login' | 'online' | 'inactive' | '__v'>;
export type UpdateContactData = Partial<CreateContactData> & { inactive?: boolean };

export const getContacts = async ({
  sortBy,
  sortOrder,
  page = 1,
  limit = 10,
  include_inactive = false,
  search = '',
}: GetContactsParams): Promise<{ data: Contact[]; pagination: any }> => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    include_inactive: String(include_inactive),
    search: search || '',
  });
  if (sortBy && sortOrder) {
    query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
  }
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  const response = await apiClient.get<{ success: boolean; message?: string; data: { docs: Contact[]; pagination: any } }>(
    `/contacts?${query.toString()}`,
    true,
    accessToken
  );
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch contacts');
  }
  return {
    data: response.data.docs,
    pagination: response.data.pagination,
  };
};

export async function createContact(contactData: CreateContactData): Promise<ApiResponse<Contact>> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  const response = await apiClient.post<ApiResponse<Contact>>('/contacts', contactData, true, accessToken);
  return response;
}

export async function updateContact(contactId: string, contactData: UpdateContactData): Promise<ApiResponse<Contact>> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  const response = await apiClient.put<ApiResponse<Contact>>(`/contacts/${contactId}`, contactData, true, accessToken);
  return response;
}

export async function deleteContact(contactId: string): Promise<ApiResponse<Contact>> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  const response = await apiClient.delete<ApiResponse<Contact>>(`/contacts/${contactId}`, true, accessToken);
  return response;
}

export async function getContact(contactId: string): Promise<ApiResponse<Contact>> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('No authentication token available');
  const response = await apiClient.get<ApiResponse<Contact>>(`/contacts/${contactId}`, true, accessToken);
  return response;
}

export const getContactMerchants = async (contactId: string): Promise<ApiResponse<any>> => {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.get<ApiResponse<any>>(`/contacts/${contactId}/merchants`, true, accessToken);
    return response;
  } catch (error) {
    throw error;
  }
};

export const addContactMerchant = async (contactId: string, merchantId: string): Promise<ApiResponse<any>> => {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.post<ApiResponse<any>>(
      `/contacts/${contactId}/merchants`,
      { merchant: merchantId },
      true,
      accessToken
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const removeContactMerchant = async (contactId: string, merchantId: string): Promise<ApiResponse<any>> => {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.delete<ApiResponse<any>>(
      `/contacts/${contactId}/merchants/${merchantId}`,
      true,
      accessToken
    );
    return response;
  } catch (error) {
    throw error;
  }
};

type GetContactListParams = {
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  include_inactive?: boolean;
  search?: string;
  merchant?: string;
};

export const getContactList = async ({
  sortBy,
  sortOrder,
  include_inactive = false,
  search = '',
  merchant = '',
}: GetContactListParams): Promise<Contact[]> => {
  const query = new URLSearchParams({
    include_inactive: String(include_inactive),
  });
  if (sortBy && sortOrder) {
    query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
  }

  if (merchant) {
    query.append('merchant', merchant);
  }
  if (search) {
    query.append('search', search);
  }

  const endpoint = env.api.endpoints.contact.getContactList;
  const response = await apiClient.get<ApiListResponse<Contact>>(`${endpoint}?${query.toString()}`);
  return response.data;
};



