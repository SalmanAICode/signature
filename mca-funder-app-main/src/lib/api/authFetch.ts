import { TokenService } from "./accesstokenService";
import { refreshToken } from "./refreshToken";

// Automatic Token Refresh (if the token is expired)
export const authFetch = async (input: RequestInfo, init: RequestInit = {}) => {
  let token = TokenService.getToken();

  const authInit: RequestInit = {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  let response = await fetch(input, authInit);

  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (!refreshed) throw new Error('Session expired');

    // Retry once with new token
    token = TokenService.getToken();
    const retryInit: RequestInit = {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    };

    response = await fetch(input, retryInit);
  }

  return response;
};