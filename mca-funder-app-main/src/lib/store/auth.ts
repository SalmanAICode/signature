// lib/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';
import { Funder } from '@/types/funder';
import { env } from '@/config/env';
import { getCurrentUser } from '@/lib/api/users';
import { refreshToken } from '@/lib/api/refreshToken';

type AuthStore = {
  accessToken: string | null;
  user: User | null;
  funder: Funder | null;
  setAuth: (token: string) => void;
  setUser: (user: User) => void;
  setFunder: (funder: Funder) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  getAccessToken: () => string | null;
  getUser: () => User | null;
  getFunder: () => Funder | null;
  refreshSession: (force?: boolean) => Promise<void>;
  fetchUser: () => Promise<void>;
};

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      funder: null,

      setAuth: (token) => {
        set({ accessToken: token });
        // Fetch user data asynchronously without blocking
        get().fetchUser().catch(err => {
          console.error('Failed to fetch user after setting auth token:', err);
        });
      },

      setUser: (user) => set({ user }),

      setFunder: (funder) => set({ funder }),

      clearAuth: () => {
        // Clear access token first to prevent refresh attempts
        set({ accessToken: null });
        // Then clear user and funder data
        set({ user: null, funder: null });
      },

      isAuthenticated: () => !!get().accessToken,
      getAccessToken: () => get().accessToken,
      getUser: () => get().user,
      getFunder: () => get().funder,

      fetchUser: async () => {
        try {
          const userData = await getCurrentUser();
          // Convert UserData to User type by ensuring required fields
          const user: User = {
            ...userData,
            type: userData.type || '',
            id: userData._id,
            __v: userData.__v || 0
          };
          set({ user });
        } catch (err) {
          console.error('Failed to fetch user:', err);
          set({ user: null });
          throw err;
        }
      },

      refreshSession: async (force = false) => {
        try {
          console.log('Attempting to refresh session...');
          
          // Try to get a new access token using the refresh token cookie
          const newAccessToken = await refreshToken();
          
          if (newAccessToken) {
            console.log('Successfully refreshed access token');
            // Set the new access token
            set({ accessToken: newAccessToken });
            // Fetch user data
            await get().fetchUser();
          } else {
            console.log('No access token received from refresh');
            get().clearAuth();
            throw new Error('No access token received from refresh');
          }
        } catch (error) {
          console.error('Failed to refresh session:', error);
          get().clearAuth();
          throw error;
        }
      },
    }),
    {
      name: env.storageKeys.auth,
      partialize: (state) => ({ 
        accessToken: state.accessToken, // Persist access token for faster page loads
        user: state.user, 
        funder: state.funder 
      }),
    }
  )
);

export default useAuthStore;
