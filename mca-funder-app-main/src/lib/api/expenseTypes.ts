import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { ApiListResponse, ApiPaginatedResponse, ApiResponse } from '@/types/api';
import { CreateExpenseTypeData, ExpenseType, UpdateExpenseTypeData } from '@/types/expenseType';
import { Pagination } from '@/types/pagination';

// Get expense type list (all expense types without pagination)
type GetExpenseTypeListParams = {
    funder?: string;
    include_inactive?: boolean;
    commission?: boolean;
    syndication?: boolean;
};

export const getExpenseTypeList = async (params: GetExpenseTypeListParams = {}): Promise<ExpenseType[]> => {
    const { funder, include_inactive = false, commission, syndication } = params;
    const query = new URLSearchParams();
    
    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    if (include_inactive !== undefined) {
        query.append('include_inactive', String(include_inactive));
    }

    if (commission !== undefined) {
        query.append('commission', String(commission));
    }

    if (syndication !== undefined) {
        query.append('syndication', String(syndication));
    }

    const endpoint = `${env.api.endpoints.expenseType.getExpenseTypeList}${query.toString() ? `?${query.toString()}` : ''}`;
    const result = await apiClient.get<ApiListResponse<ExpenseType>>(endpoint);
    return result.data;
}; 

export const getExpenseTypeById = async (expenseTypeId: string): Promise<ExpenseType> => {
  const endpoint = env.api.endpoints.expenseType.getExpenseTypeById.replace(':expenseTypeId', expenseTypeId);
  const result = await apiClient.get<ApiResponse<ExpenseType>>(endpoint);
  return result.data;
};

// Get expense types with pagination and filtering
type GetExpenseTypesParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    search?: string | null;
    funder?: string | null;
    include_inactive?: boolean;
};

export const getExpenseTypes = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    search,
    funder,
    include_inactive = false,
}: GetExpenseTypesParams = {}): Promise<{ data: ExpenseType[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
    });

    if (sortBy && sortOrder) {
        query.append('sort', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);
    }

    if (search && search.trim() !== '') {
        query.append('search', search);
    }

    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    const endpoint = `${env.api.endpoints.expenseType.getExpenseTypes}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<ExpenseType>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

export const createExpenseType = async (expenseType: CreateExpenseTypeData): Promise<ExpenseType> => {
  const endpoint = env.api.endpoints.expenseType.createExpenseType;
  const result = await apiClient.post<ApiResponse<ExpenseType>>(endpoint, expenseType);
  return result.data;
};

export const updateExpenseType = async (expenseTypeId: string, expenseType: UpdateExpenseTypeData): Promise<ExpenseType> => {
  const endpoint = env.api.endpoints.expenseType.updateExpenseType.replace(':expenseTypeId', expenseTypeId);
  const result = await apiClient.put<ApiResponse<ExpenseType>>(endpoint, expenseType);
  return result.data;
};

export const deleteExpenseType = async (expenseTypeId: string): Promise<void> => {
  const endpoint = env.api.endpoints.expenseType.deleteExpenseType.replace(':expenseTypeId', expenseTypeId);
  await apiClient.delete(endpoint);
};
