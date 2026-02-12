import { env } from '@/config/env';
import apiClient from '@/lib/api/client';
import { Pagination } from '@/types/pagination';
import { Formula, CreateFormulaData, UpdateFormulaData } from '@/types/formula';
import { ApiResponse, ApiPaginatedResponse, ApiListResponse } from '@/types/api';

// Get formulas with pagination and filtering
type GetFormulasParams = {
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    page?: number;
    limit?: number;
    search?: string | null;
    funder?: string | null;
    include_inactive?: boolean;
    include_private?: boolean;
};

export const getFormulas = async ({
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    search,
    funder,
    include_inactive = false,
    include_private = false,
}: GetFormulasParams = {}): Promise<{ data: Formula[], pagination: Pagination }> => {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        include_inactive: String(include_inactive),
        include_private: String(include_private),
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

    const endpoint = `${env.api.endpoints.formula.getFormulas}?${query.toString()}`;
    const result = await apiClient.get<ApiPaginatedResponse<Formula>>(endpoint);
    return {
        data: result.data.docs,
        pagination: result.data.pagination,
    };
};

// Get formula list (all formulas without pagination)
export const getFormulaList = async (funder?: string): Promise<Formula[]> => {
    const query = new URLSearchParams();
    
    if (funder && funder.trim() !== '') {
        query.append('funder', funder);
    }

    const endpoint = `${env.api.endpoints.formula.getFormulaList}${query.toString() ? `?${query.toString()}` : ''}`;
    const result = await apiClient.get<ApiListResponse<Formula>>(endpoint);
    return result.data;
};

// Get formula by ID
export const getFormulaById = async (formulaId: string): Promise<Formula> => {
    const endpoint = env.api.endpoints.formula.getFormulaById.replace(':formulaId', formulaId);
    const result = await apiClient.get<ApiResponse<Formula>>(endpoint);
    return result.data;
};

// Create formula
export const createFormula = async (formulaData: CreateFormulaData): Promise<Formula> => {
    const endpoint = env.api.endpoints.formula.createFormula;
    const result = await apiClient.post<ApiResponse<Formula>>(endpoint, formulaData);
    return result.data;
};

// Update formula
export const updateFormula = async (formulaId: string, formulaData: UpdateFormulaData): Promise<Formula> => {
    const endpoint = env.api.endpoints.formula.updateFormula.replace(':formulaId', formulaId);
    const result = await apiClient.put<ApiResponse<Formula>>(endpoint, formulaData);
    return result.data;
};

// Delete formula
export const deleteFormula = async (formulaId: string): Promise<void> => {
    const endpoint = env.api.endpoints.formula.deleteFormula.replace(':formulaId', formulaId);
    await apiClient.delete<ApiResponse<void>>(endpoint);
};

// Utility function to get formula by name
export const getFormulaByName = async (name: string, funder?: string): Promise<Formula | null> => {
    try {
        const formulas = await getFormulaList(funder);
        return formulas.find(formula => formula.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
        console.error('Error fetching formula by name:', error);
        return null;
    }
};

// Utility function to get shared formulas
export const getSharedFormulas = async (): Promise<Formula[]> => {
    try {
        const formulas = await getFormulaList();
        return formulas.filter(formula => formula.shared === true);
    } catch (error) {
        console.error('Error fetching shared formulas:', error);
        return [];
    }
}; 

// Calculate formula
type CalculateFormulaParams = {
    formulaId: string;
    fund: number;
    payback: number;
};

export const calculateFormula = async ({formulaId, fund, payback}: CalculateFormulaParams): Promise<number> => { 
    const endpoint = env.api.endpoints.formula.calculateFormula.replace(':formulaId', formulaId);
    const query = new URLSearchParams({
        fund: String(fund),
        payback: String(payback)
    });
    const result = await apiClient.get<ApiResponse<number>>(`${endpoint}?${query.toString()}`);
    return result.data;
};