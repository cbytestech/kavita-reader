// src/stores/themeStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '../utils/theme';

interface ThemeState {
  isDarkMode: boolean;
  isGrayscaleReading: boolean;
  pageTurnSoundsEnabled: boolean;
  theme: Theme;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  toggleGrayscaleReading: () => void;
  setGrayscaleReading: (isGrayscale: boolean) => void;
  togglePageTurnSounds: () => void;
  setPageTurnSounds: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      isGrayscaleReading: false,
      pageTurnSoundsEnabled: true,
      theme: lightTheme,

      toggleDarkMode: () => {
        const newIsDark = !get().isDarkMode;
        set({
          isDarkMode: newIsDark,
          theme: newIsDark ? darkTheme : lightTheme,
        });
      },

      setDarkMode: (isDark: boolean) => {
        set({
          isDarkMode: isDark,
          theme: isDark ? darkTheme : lightTheme,
        });
      },

      toggleGrayscaleReading: () => {
        set({
          isGrayscaleReading: !get().isGrayscaleReading,
        });
      },

      setGrayscaleReading: (isGrayscale: boolean) => {
        set({
          isGrayscaleReading: isGrayscale,
        });
      },

      togglePageTurnSounds: () => {
        set({
          pageTurnSoundsEnabled: !get().pageTurnSoundsEnabled,
        });
      },

      setPageTurnSounds: (enabled: boolean) => {
        set({
          pageTurnSoundsEnabled: enabled,
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        isGrayscaleReading: state.isGrayscaleReading,
        pageTurnSoundsEnabled: state.pageTurnSoundsEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.theme = state.isDarkMode ? darkTheme : lightTheme;
        }
      },
    }
  )
);