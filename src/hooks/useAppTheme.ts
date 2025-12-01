// src/hooks/useAppTheme.ts
import { useTheme } from '@react-navigation/native';
import { useMemo } from 'react';
import { lightTheme, darkTheme, Theme } from '../utils/theme';

/**
 * Custom hook that combines React Navigation's theme with our app theme
 * This provides type-safe access to our custom theme colors
 */
export function useAppTheme(): Theme {
  const navTheme = useTheme();
  
  // Determine which theme to use based on navigation theme's dark mode
  return useMemo(() => {
    return navTheme.dark ? darkTheme : lightTheme;
  }, [navTheme.dark]);
}

/**
 * Hook to check if dark mode is active
 */
export function useIsDarkMode(): boolean {
  const navTheme = useTheme();
  return navTheme.dark;
}