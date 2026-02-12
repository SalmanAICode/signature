// lib/api/auth/refreshToken.ts
import { TokenService } from './accesstokenService';

export const refreshToken = async (): Promise<string> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const { accessToken, user } = data;

    if (!accessToken) {
      throw new Error('No access token in refresh response');
    }

    TokenService.setToken(accessToken, user);
    
    return accessToken;
  } catch (error) {
    TokenService.clearToken();
    throw error;
  }
};
