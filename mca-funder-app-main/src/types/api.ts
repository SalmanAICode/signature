import { Pagination } from "./pagination";

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
};

export type ApiPaginatedResponse<T> = {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: {
    docs: T[];
    pagination: Pagination;
  };
};

export type ApiListResponse<T> = {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T[];
};