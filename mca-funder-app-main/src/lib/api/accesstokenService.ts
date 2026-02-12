import useAuthStore from '@/lib/store/auth';

export const TokenService = {
  setToken: (token: string): void => {
    useAuthStore.getState().setAuth(token);
  },

  getToken: (): string | null => {
    return useAuthStore.getState().accessToken;
  },

  clearToken: (): void => {
    useAuthStore.getState().clearAuth();
  },

  hasToken: (): boolean => {
    return useAuthStore.getState().isAuthenticated();
  },

  getAuthHeader: (): Record<string, string> => {
    const token = TokenService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};