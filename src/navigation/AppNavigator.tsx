// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';
import ConnectScreen from '../screens/ConnectScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryDetailScreen from '../screens/LibraryDetailScreen';
import SeriesDetailScreen from '../screens/SeriesDetailScreen';
import ReaderScreen from '../screens/ReaderScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useThemeStore } from '../stores/themeStore';

export type RootStackParamList = {
  Connect: undefined;
  Login: { serverUrl: string };
  Home: undefined;
  LibraryDetail: { libraryId: number; libraryName: string };
  SeriesDetail: { seriesId: number };
  Reader: { chapterId: number; seriesId: number };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        id={undefined}
        initialRouteName="Connect"
        screenOptions={{
          headerStyle: { 
            backgroundColor: theme.primary 
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen 
          name="Connect" 
          component={ConnectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'My Libraries',
            headerLeft: () => null, // Remove back button on home
            headerRight: () => (
              <IconButton
                icon="cog"
                iconColor="#fff"
                size={24}
                onPress={() => navigation.navigate('Settings')}
              />
            ),
          })}
        />
        <Stack.Screen 
          name="LibraryDetail" 
          component={LibraryDetailScreen}
          options={({ route, navigation }) => ({ 
            title: route.params.libraryName,
            headerRight: () => (
              <IconButton
                icon="cog"
                iconColor="#fff"
                size={24}
                onPress={() => navigation.navigate('Settings')}
              />
            ),
          })}
        />
        <Stack.Screen 
          name="SeriesDetail" 
          component={SeriesDetailScreen}
          options={({ navigation }) => ({ 
            title: 'Series Details',
            headerRight: () => (
              <IconButton
                icon="cog"
                iconColor="#fff"
                size={24}
                onPress={() => navigation.navigate('Settings')}
              />
            ),
          })}
        />
        <Stack.Screen 
          name="Reader" 
          component={ReaderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            title: 'Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}