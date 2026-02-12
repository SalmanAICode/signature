const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { TokenService } from './accesstokenService';
import { refreshToken } from './refreshToken';

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined in .env file');
}

class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, requireAuth: boolean = true, accessToken?: string): Promise<T> {
    let token = accessToken || TokenService.getToken();

    // If no token but auth is required, try to refresh from cookie
    if (requireAuth && !token) {
      try {
        console.log('No token found, attempting to refresh from cookie...');
        token = await refreshToken();
        if (token) {
          console.log('Successfully refreshed token');
        }
      } catch (err) {
        console.error('Failed to refresh token:', err);
        throw new Error('No authentication token available');
      }
    }

    if (requireAuth && !token) {
      throw new Error('No authentication token available');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (requireAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchWithAuth = async (headers: Record<string, string>) => {
      return await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Always include cookies for refresh token
      });
    };

    let response = await fetchWithAuth(headers);

    // Handle 401 responses by attempting token refresh
    if (response.status === 401 && requireAuth) {
      try {
        const newToken = await refreshToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetchWithAuth(headers);
      } catch (err) {
        // Token refresh failed - clear auth and redirect to login
        TokenService.clearToken();
        
        // Only redirect if we're in the browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        throw new Error('Authentication failed. Please log in again.');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  private async requestBlob(endpoint: string, options: RequestInit = {}, requireAuth: boolean = true, accessToken?: string): Promise<Blob> {
    let token = accessToken || TokenService.getToken();

    // If no token but auth is required, try to refresh from cookie
    if (requireAuth && !token) {
      try {
        console.log('No token found, attempting to refresh from cookie...');
        token = await refreshToken();
        if (token) {
          console.log('Successfully refreshed token');
        }
      } catch (err) {
        console.error('Failed to refresh token:', err);
        throw new Error('No authentication token available');
      }
    }

    if (requireAuth && !token) {
      throw new Error('No authentication token available');
    }

    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    if (requireAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchWithAuth = async (headers: Record<string, string>) => {
      return await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    };

    let response = await fetchWithAuth(headers);

    // Handle 401 responses by attempting token refresh
    if (response.status === 401 && requireAuth) {
      try {
        const newToken = await refreshToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetchWithAuth(headers);
      } catch (err) {
        TokenService.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication failed. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Request failed');
    }

    return response.blob();
  }

  private async requestFormData<T>(endpoint: string, formData: FormData, requireAuth: boolean = true, accessToken?: string): Promise<T> {
    let token = accessToken || TokenService.getToken();

    // If no token but auth is required, try to refresh from cookie
    if (requireAuth && !token) {
      try {
        console.log('No token found, attempting to refresh from cookie...');
        token = await refreshToken();
        if (token) {
          console.log('Successfully refreshed token');
        }
      } catch (err) {
        console.error('Failed to refresh token:', err);
        throw new Error('No authentication token available');
      }
    }

    if (requireAuth && !token) {
      throw new Error('No authentication token available');
    }

    const headers: Record<string, string> = {
      // Don't set Content-Type for FormData, browser will set it with boundary
      'Authorization': requireAuth && token ? `Bearer ${token}` : '',
    };

    const fetchWithAuth = async (headers: Record<string, string>) => {
      return await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });
    };

    let response = await fetchWithAuth(headers);

    // Handle 401 responses by attempting token refresh
    if (response.status === 401 && requireAuth) {
      try {
        const newToken = await refreshToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetchWithAuth(headers);
      } catch (err) {
        TokenService.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication failed. Please log in again.');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  public async get<T>(endpoint: string, requireAuth: boolean = true, accessToken?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, requireAuth, accessToken);
  }

  public async getBlob(endpoint: string, requireAuth: boolean = true, accessToken?: string): Promise<Blob> {
    return this.requestBlob(endpoint, { method: 'GET' }, requireAuth, accessToken);
  }

  public async post<T>(endpoint: string, body: any, requireAuth: boolean = true, accessToken?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, requireAuth, accessToken);
  }

  public async postFormData<T>(endpoint: string, formData: FormData, requireAuth: boolean = true, accessToken?: string): Promise<T> {
    return this.requestFormData<T>(endpoint, formData, requireAuth, accessToken);
  }

  public async put<T>(endpoint: string, body: any, requireAuth: boolean = true, accessToken?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, requireAuth, accessToken);
  }

  public async delete<T>(endpoint: string, requireAuth: boolean = true, accessToken?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, requireAuth, accessToken);
  }
}

export default ApiClient.getInstance(); 