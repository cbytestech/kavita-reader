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
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/page-turn.mp3'),
        { volume: 0.3 }
      );
      setSound(newSound);
    } catch (error) {
      console.log('⚠️ Sound file not found - page turns will be silent');
    }
  };

  const playPageTurnSound = async () => {
    if (!pageTurnSoundsEnabled || !sound) return;
    
    try {
      await sound.replayAsync();
    } catch (error) {
      console.log('⚠️ Failed to play sound:', error);
    }
  };

  const loadChapter = async () => {
    if (!client) {
      console.log('❌ No client available');
      return;
    }
    
    console.log('📚 Loading chapter...');
    console.log('  ℹ️ Chapter ID:', chapterId);
    setLoading(true);
    
    try {
      console.log('  📡 Fetching chapter info from API...');
      const info = await client.getChapterInfo(chapterId);
      console.log('    ✅ Chapter info received');
      console.log('    ℹ️ Title:', info.title);
      console.log('    ℹ️ Total pages:', info.pages);
      console.log('    ℹ️ Current page:', info.currentPage || 0);
      console.log('    ℹ️ File name:', info.fileName);
      
      setChapterInfo(info);
      setTotalPages(info.pages || 0);
      
      const startPage = (info.currentPage && info.currentPage > 0) ? info.currentPage : 0;
      console.log('  📄 Starting at page:', startPage + 1, '(0-indexed:', startPage + ')');
      setCurrentPage(startPage);
      
      console.log('  💿 Caching chapter...');
      await client.cacheChapter(chapterId);
      console.log('    ✅ Chapter cached');
      
      setLoading(false);
      console.log('✅ Chapter loaded successfully');
      
    } catch (error: any) {
      console.log('❌ Failed to load chapter');
      console.log('  ℹ️ Error:', error.message);
      console.log('  ℹ️ Chapter ID:', chapterId);
      Alert.alert('Error', 'Failed to load chapter');
      setLoading(false);
    }
  };

  const loadImageWithAuth = async (page: number) => {
    if (!client) {
      console.log('❌ No client available for image loading');
      return;
    }
    
    console.log('🖼️ Loading image for page', page + 1);
    setImageLoading(true);
    
    try {
      const apiKey = client.getApiKey();
      const url = `${client.getBaseUrl()}/api/Reader/image?chapterId=${chapterId}&page=${page}&extractPdf=true&apiKey=${apiKey}`;
      const token = client.getToken();
      
      console.log('  📡 Fetching image from API...');
      console.log('    ℹ️ Page:', page + 1, '/', totalPages);
      console.log('    ℹ️ Extract PDF: true');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('  📥 Response received');
      console.log('    ℹ️ Status:', response.status);
      
      if (!response.ok) {
        console.log('  ❌ Failed to load page');
        console.log('    ℹ️ HTTP Status:', response.status);
        Alert.alert('Error', `Failed to load page ${page + 1}`);
        setImageLoading(false);
        setLoading(false);
        return;
      }
      
      console.log('  📦 Converting response to blob...');
      const blob = await response.blob();
      console.log('    ℹ️ Blob size:', (blob.size / 1024).toFixed(2), 'KB');
      
      console.log('  🔄 Converting to base64...');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageData(base64);
        setImageLoading(false);
        setLoading(false);
        console.log('  ✅ Image loaded and displayed');
        console.log('    ℹ️ Base64 length:', base64.length, 'characters');
      };
      reader.onerror = () => {
        console.log('  ❌ FileReader error');
        Alert.alert('Error', 'Failed to process image');
        setImageLoading(false);
        setLoading(false);
      };
      reader.readAsDataURL(blob);
      
    } catch (error: any) {
      console.log('❌ Failed to load image');
      console.log('  ℹ️ Error:', error.message);
      console.log('  ℹ️ Error name:', error.name);
      console.log('  ℹ️ Page:', page + 1);
      
      if (error.name === 'AbortError') {
        console.log('  ⏱️ Request timed out after 30 seconds');
        Alert.alert('Timeout', 'Page took too long to load');
      } else {
        Alert.alert('Error', 'Failed to load page');
      }
      
      setImageLoading(false);
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!client || !chapterInfo) {
      console.log('⚠️ Cannot save progress - missing client or chapter info');
      return;
    }
    
    console.log('💾 Saving reading progress...');
    console.log('  ℹ️ Series ID:', seriesId);
    console.log('  ℹ️ Chapter ID:', chapterId);
    console.log('  ℹ️ Page:', currentPage + 1, '/', totalPages);
    
    try {
      await client.markProgress(
        seriesId,
        chapterInfo.volumeId,
        chapterId,
        currentPage
      );
      console.log('  ✅ Progress saved successfully');
    } catch (error) {
      console.log('  ❌ Failed to save progress');
      console.log('    ℹ️ Error:', error);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      console.log('➡️ Next page:', currentPage + 2, '/', totalPages);
      playPageTurnSound();
      setCurrentPage(currentPage + 1);
    } else {
      console.log('🏁 Reached end of chapter');
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
      console.log('⬅️ Previous page:', currentPage, '/', totalPages);
      playPageTurnSound();
      setCurrentPage(currentPage - 1);
    } else {
      console.log('⚠️ Already at first page');
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