import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'red' | 'orange';

type ThemeStore = {
  // Current theme mode
  mode: ThemeMode;
  
  // Actions
  setTheme: (mode: ThemeMode) => void;
  
  // Apply theme to document
  applyTheme: (mode?: ThemeMode) => void;
  
  // Initialize theme on app load
  initializeTheme: () => void;
  
  // Get available themes
  getAvailableThemes: () => Array<{
    key: ThemeMode;
    name: string;
    description: string;
    primaryColor: string;
  }>;
};

const THEME_CONFIG = {
  light: {
    name: 'Light',
    description: 'Clean and bright white theme',
    primaryColor: '#FFFFFF'
  },
  dark: {
    name: 'Dark', 
    description: 'Easy on the eyes black theme',
    primaryColor: '#4A5F8A'
  },
  blue: {
    name: 'Blue',
    description: 'Professional ocean blue theme',
    primaryColor: '#2563eb'
  },
  green: {
    name: 'Green',
    description: 'Nature-inspired forest theme',
    primaryColor: '#16a34a'
  },
  purple: {
    name: 'Purple',
    description: 'Creative royal purple theme',
    primaryColor: '#9333ea'
  },
  red: {
    name: 'Red',
    description: 'Bold crimson red theme',
    primaryColor: '#dc2626'
  },
  orange: {
    name: 'Orange',
    description: 'Warm sunset orange theme',
    primaryColor: '#ea580c'
  }
} as const;

const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'light',

      setTheme: (mode) => {
        set({ mode });
        get().applyTheme(mode);
      },

      applyTheme: (mode) => {
        const themeMode = mode || get().mode;
        
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          
          // Remove all existing theme classes
          Object.keys(THEME_CONFIG).forEach(theme => {
            root.classList.remove(theme);
          });
          
          // Add new theme class
          root.classList.add(themeMode);
          
          // Update data attribute for additional styling if needed
          root.setAttribute('data-theme', themeMode);
        }
      },

      initializeTheme: () => {
        const { mode } = get();
        get().applyTheme(mode);
      },

      getAvailableThemes: () => {
        return Object.entries(THEME_CONFIG).map(([key, config]) => ({
          key: key as ThemeMode,
          name: config.name,
          description: config.description,
          primaryColor: config.primaryColor
        }));
      },
    }),
    {
      name: 'webapp-theme',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

export default useThemeStore; 