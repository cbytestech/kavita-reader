import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConnectScreen from '../screens/ConnectScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryDetailScreen from '../screens/LibraryDetailScreen';
import SeriesDetailScreen from '../screens/SeriesDetailScreen';
import ReaderScreen from '../screens/ReaderScreen';

export type RootStackParamList = {
  Connect: undefined;
  Login: { serverUrl: string };
  Home: undefined;
  LibraryDetail: { libraryId: number; libraryName: string };
  SeriesDetail: { seriesId: number };
  Reader: { chapterId: number; seriesId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        id={undefined}
        initialRouteName="Connect"
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
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="LibraryDetail" 
          component={LibraryDetailScreen}
          options={({ route }) => ({ 
            title: route.params.libraryName,
            headerStyle: { backgroundColor: '#1976D2' },
            headerTintColor: '#fff',
          })}
        />
        <Stack.Screen 
          name="SeriesDetail" 
          component={SeriesDetailScreen}
          options={{ 
            title: 'Series Details',
            headerStyle: { backgroundColor: '#1976D2' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="Reader" 
          component={ReaderScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}