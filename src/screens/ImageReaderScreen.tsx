// src/screens/ImageReaderScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image as RNImage,
} from 'react-native';
import { Text, IconButton, ProgressBar } from 'react-native-paper';
import { Audio } from 'expo-av';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ImageReaderScreen({ route, navigation }: Props) {
  const { chapterId, seriesId } = route.params;
  
  const [chapterInfo, setChapterInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [imageData, setImageData] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const client = useServerStore((state) => state.getActiveClient());
  const isGrayscaleReading = useThemeStore((state) => state.isGrayscaleReading);
  const pageTurnSoundsEnabled = useThemeStore((state) => state.pageTurnSoundsEnabled);

  useEffect(() => {
    loadSound();
    loadChapter();
    
    return () => {
      saveProgress();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (currentPage > 0 && chapterInfo) {
      const timeout = setTimeout(() => saveProgress(), 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!loading && chapterInfo) {
      loadImageWithAuth(currentPage);
    }
  }, [currentPage, loading]);

  const loadSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      // Create a simple page turn sound using expo-av
      // You'll need to add a page-turn.mp3 to your assets folder
      // For now, we'll use a placeholder
      const { sound: newSound } = await Audio.Sound.createAsync(
        // Replace this with your actual sound file
        require('../../assets/page-turn.mp3'),
        { volume: 0.3 }
      );
      setSound(newSound);
    } catch (error) {
      console.log('Failed to load sound:', error);
    }
  };

  const playPageTurnSound = async () => {
    if (!pageTurnSoundsEnabled || !sound) return;
    
    try {
      await sound.replayAsync();
    } catch (error) {
      console.log('Failed to play sound:', error);
    }
  };

  const loadChapter = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const info = await client.getChapterInfo(chapterId);
      setChapterInfo(info);
      setTotalPages(info.pages || 0);
      
      const startPage = (info.currentPage && info.currentPage > 0) ? info.currentPage : 0;
      setCurrentPage(startPage);
      
      await client.cacheChapter(chapterId);
      setLoading(false);
      
    } catch (error: any) {
      console.error('Failed to load chapter:', error);
      Alert.alert('Error', 'Failed to load chapter');
      setLoading(false);
    }
  };

  const loadImageWithAuth = async (page: number) => {
    if (!client) return;
    
    setImageLoading(true);
    try {
      const apiKey = client.getApiKey();
      const url = `${client.getBaseUrl()}/api/Reader/image?chapterId=${chapterId}&page=${page}&extractPdf=true&apiKey=${apiKey}`;
      const token = client.getToken();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        Alert.alert('Error', `Failed to load page ${page + 1}`);
        setImageLoading(false);
        setLoading(false);
        return;
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageData(base64);
        setImageLoading(false);
        setLoading(false);
      };
      reader.onerror = () => {
        Alert.alert('Error', 'Failed to process image');
        setImageLoading(false);
        setLoading(false);
      };
      reader.readAsDataURL(blob);
      
    } catch (error: any) {
      console.error('Failed to load image:', error);
      
      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Page took too long to load');
      } else {
        Alert.alert('Error', 'Failed to load page');
      }
      
      setImageLoading(false);
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!client || !chapterInfo) return;
    
    try {
      await client.markProgress(
        seriesId,
        chapterInfo.volumeId,
        chapterId,
        currentPage
      );
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      playPageTurnSound();
      setCurrentPage(currentPage + 1);
    } else {
      Alert.alert(
        'Chapter Complete',
        "You've reached the end of this chapter.",
        [
          { text: 'Stay Here', style: 'cancel' },
          { 
            text: 'Go Back', 
            onPress: () => {
              saveProgress();
              navigation.goBack();
            }
          },
        ]
      );
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      playPageTurnSound();
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading chapter...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isGrayscaleReading && styles.grayscaleContainer]}>
      <TouchableOpacity
        style={styles.imageContainer}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        {imageLoading && imageData && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="small" color="#1976D2" />
          </View>
        )}
        
        {imageData ? (
          <View>
            <RNImage
              source={{ uri: imageData }}
              style={styles.pageImage}
              resizeMode="contain"
            />
            {isGrayscaleReading && (
              <View style={styles.grayscaleOverlay} pointerEvents="none" />
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.placeholderText}>Loading page...</Text>
          </View>
        )}
      </TouchableOpacity>

      {!showControls && (
        <>
          <TouchableOpacity
            style={styles.leftTapZone}
            onPress={goToPreviousPage}
            activeOpacity={0.3}
          />
          <TouchableOpacity
            style={styles.rightTapZone}
            onPress={goToNextPage}
            activeOpacity={0.3}
          />
        </>
      )}

      {showControls && (
        <>
          <View style={styles.topBar}>
            <IconButton
              icon="arrow-left"
              iconColor="#fff"
              size={24}
              onPress={() => {
                saveProgress();
                navigation.goBack();
              }}
            />
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {chapterInfo?.title || 'Reading'}
            </Text>
            <View style={{ width: 48 }} />
          </View>

          <View style={styles.bottomBar}>
            <ProgressBar
              progress={totalPages > 0 ? (currentPage + 1) / totalPages : 0}
              color="#1976D2"
              style={styles.progressBar}
            />
            <Text style={styles.pageInfo}>
              Page {currentPage + 1} / {totalPages}
            </Text>
            <View style={styles.controlButtons}>
              <IconButton
                icon="chevron-left"
                iconColor="#fff"
                size={28}
                onPress={goToPreviousPage}
                disabled={currentPage === 0}
              />
              <IconButton
                icon="chevron-right"
                iconColor="#fff"
                size={28}
                onPress={goToNextPage}
                disabled={currentPage >= totalPages - 1}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  grayscaleContainer: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  grayscaleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    marginTop: 16,
  },
  leftTapZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.3,
  },
  rightTapZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.3,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  topBarTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  pageInfo: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
});