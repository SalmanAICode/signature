'use client';

import { useEffect } from 'react';
import useThemeStore from '@/lib/store/theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme on app load
    initializeTheme();
  }, [initializeTheme]);

  return <>{children}</>;
} 