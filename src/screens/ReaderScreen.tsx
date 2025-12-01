// src/screens/ReaderScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useServerStore } from '../stores/serverStore';
import { useAppTheme } from '../hooks/useAppTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ImageReaderScreen from './ImageReaderScreen';
import EpubReaderScreen from './EpubReaderScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

export default function ReaderScreen({ route, navigation }: Props) {
  const { chapterId, seriesId } = route.params;
  const [loading, setLoading] = useState(true);
  const [isEpub, setIsEpub] = useState(false);
  
  const client = useServerStore((state) => state.getActiveClient());
  const theme = useAppTheme();

  useEffect(() => {
    detectReaderType();
  }, []);

  const detectReaderType = async () => {
    if (!client) return;
    
    try {
      const chapterInfo = await client.getChapterInfo(chapterId);
      const fileName = chapterInfo.fileName?.toLowerCase() || '';
      
      // Check if it's an EPUB
      if (fileName.endsWith('.epub')) {
        setIsEpub(true);
      } else {
        setIsEpub(false);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to detect reader type:', error);
      Alert.alert('Error', 'Failed to load chapter');
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading chapter...
        </Text>
      </View>
    );
  }

  // Route to the appropriate reader
  if (isEpub) {
    return <EpubReaderScreen route={route} navigation={navigation} />;
  } else {
    return <ImageReaderScreen route={route} navigation={navigation} />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
});