// App.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { useThemeStore } from './src/stores/themeStore';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Give stores time to hydrate from AsyncStorage
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Create Paper theme based on our custom theme
  const paperTheme = isDarkMode
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: theme.primary,
          primaryContainer: theme.primaryLight,
          secondary: theme.accent,
          secondaryContainer: theme.accentLight,
          background: theme.background,
          surface: theme.surface,
          error: theme.error,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: theme.primary,
          primaryContainer: theme.primaryLight,
          secondary: theme.accent,
          secondaryContainer: theme.accentLight,
          background: theme.background,
          surface: theme.surface,
          error: theme.error,
        },
      };

  // Show loading screen while stores hydrate
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </PaperProvider>
  );
}