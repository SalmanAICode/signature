import { env } from '@/config/env';
import useAuthStore from '@/lib/store/auth';
import { TokenService } from './accesstokenService';
import { clearAllStores } from '@/lib/store/clearAllStores';
import { Funder } from '@/types/funder';

interface LoginResponse {
  success: boolean;
  accessToken?: string;
  funder?: string;
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

export async function loginFunder(email: string, password: string): Promise<{ accessToken: string; funder: string }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/funder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  const { accessToken, funder } = data;

  // Store the access token (user will be fetched next)
  useAuthStore.getState().setAuth(accessToken);

  // If funder ID is provided, fetch the full funder object and store it
  if (funder) {
    try {
      const funderData = await getSelectedFunder();
      useAuthStore.getState().setFunder(funderData);
    } catch (error) {
      console.warn('Failed to fetch funder details:', error);
      // Continue with login even if funder fetch fails
    }
  }

  return { accessToken, funder };
}

export async function logoutFunder(): Promise<LogoutResponse> {

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout/funder`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    // Even if the backend call fails, we've already cleared the local auth state
    console.warn('Backend logout failed, but proceeding to clear local auth state:', error);
    throw error;
  } finally {
    // Clear token service and all stores data
    TokenService.clearToken();
    clearAllStores();
  }
}

export async function setSelectedFunder(id: string): Promise<{ accessToken: string; funder: string }> {
  const accessToken = useAuthStore.getState().getAccessToken();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${env.api.endpoints.funder.setSelectedFunder}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
    body: JSON.stringify({ id }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to set selected funder');
  }

  const { accessToken: newAccessToken, funder } = data;

  // Store the access token and funder
  useAuthStore.getState().setAuth(newAccessToken);
  if (funder) {
    useAuthStore.getState().setFunder(funder);
  }

  return { accessToken: newAccessToken, funder };
}

export async function getSelectedFunder(): Promise<Funder> {
  const accessToken = useAuthStore.getState().getAccessToken();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${env.api.endpoints.funder.getSelectedFunder}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to get selected funder');
  }

  return data.data;
}



