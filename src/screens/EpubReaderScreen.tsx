// src/screens/EpubReaderScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, ProgressBar } from 'react-native-paper';
import { Audio } from 'expo-av';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import { useAppTheme, useIsDarkMode } from '../hooks/useAppTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Simple HTML parser for basic tags
const parseHtmlToReactNative = (html: string, fontSize: number, isDark: boolean, isGrayscale: boolean) => {
  const textColor = isDark ? '#e0e0e0' : '#1a1a1a';
  const linkColor = isDark ? '#64b5f6' : '#1976d2';
  
  // Strip HTML tags and convert to plain text with basic formatting
  let text = html;
  
  // Remove script and style tags entirely
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Convert common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  
  // Remove all other HTML tags but keep the content
  text = text.replace(/<[^>]+>/g, '');
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Split into paragraphs (double line breaks indicate new paragraphs)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  return paragraphs;
};

export default function EpubReaderScreen({ route, navigation }: Props) {
  const { chapterId, seriesId } = route.params;
  
  const [chapterInfo, setChapterInfo] = useState<any>(null);
  const [bookInfo, setBookInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [pageContent, setPageContent] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const client = useServerStore((state) => state.getActiveClient());
  const isGrayscaleReading = useThemeStore((state) => state.isGrayscaleReading);
  const pageTurnSoundsEnabled = useThemeStore((state) => state.pageTurnSoundsEnabled);
  const theme = useAppTheme();
  const isDarkMode = useIsDarkMode();

  useEffect(() => {
    loadSound();
    loadEpub();
    
    return () => {
      saveProgress();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (currentPage >= 0 && chapterInfo) {
      const timeout = setTimeout(() => saveProgress(), 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentPage]);

  useEffect(() => {
    if (bookInfo && currentPage >= 0) {
      loadPageContent(currentPage);
    }
  }, [currentPage, isDarkMode, isGrayscaleReading, fontSize]);

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

  const loadEpub = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      console.log('📘 Loading EPUB chapter:', chapterId);
      
      const [info, epubInfo] = await Promise.all([
        client.getChapterInfo(chapterId),
        client.getBookInfo(chapterId)
      ]);
      
      console.log('📖 Chapter info:', info);
      console.log('📚 Book info:', epubInfo);
      
      setChapterInfo(info);
      setBookInfo(epubInfo);
      setTotalPages(epubInfo.pages || 0);
      
      const startPage = (info.currentPage && info.currentPage > 0) ? info.currentPage : 0;
      console.log(`📄 Starting at page ${startPage + 1} of ${epubInfo.pages} (0-indexed: ${startPage})`);
      setCurrentPage(startPage);
      
      await loadPageContent(startPage);
      
    } catch (error: any) {
      console.error('❌ Failed to load EPUB:', error);
      Alert.alert('Error', 'Failed to load EPUB: ' + error.message);
      setLoading(false);
    }
  };

  const loadPageContent = async (page: number) => {
    if (!client) return;
    
    try {
      console.log(`📄 Loading page ${page + 1}/${totalPages} (0-indexed: ${page})`);
      const rawHtml = await client.getBookPage(chapterId, page);
      
      // Parse HTML to plain text paragraphs
      const paragraphs = parseHtmlToReactNative(rawHtml, fontSize, isDarkMode, isGrayscaleReading);
      setPageContent(paragraphs);
      setLoading(false);
      
      console.log(`✅ Page ${page + 1} loaded with ${paragraphs.length} paragraphs`);
    } catch (error: any) {
      console.error('❌ Failed to load page:', error);
      Alert.alert('Error', 'Failed to load page');
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
      console.log(`💾 Progress saved: page ${currentPage + 1} (0-indexed: ${currentPage})`);
    } catch (error) {
      console.error('❌ Failed to save progress:', error);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      playPageTurnSound();
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
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
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
    }
  };

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(32, fontSize + delta));
    setFontSize(newSize);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading EPUB...
        </Text>
      </SafeAreaView>
    );
  }

  const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const textColor = isGrayscaleReading 
    ? (isDarkMode ? '#b0b0b0' : '#4a4a4a')
    : (isDarkMode ? '#e0e0e0' : '#1a1a1a');

  return (
    <View style={[styles.fullScreen, { backgroundColor }]}>
      {/* Hide status bar for immersive reading */}
      <StatusBar hidden={!showControls} animated />
      
      <SafeAreaView style={styles.container} edges={showControls ? ['top', 'bottom'] : []}>
        <View style={styles.contentWrapper}>
          {/* Center tap zone - toggle controls */}
          <TouchableOpacity
            style={styles.centerTapZone}
            activeOpacity={1}
            onPress={() => setShowControls(!showControls)}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: showControls ? 80 : 20 }
              ]}
              showsVerticalScrollIndicator={false}
            >
              {pageContent.map((paragraph, index) => (
                <Text
                  key={index}
                  style={[
                    styles.paragraph,
                    {
                      fontSize,
                      lineHeight: fontSize * 1.6,
                      color: textColor,
                    }
                  ]}
                >
                  {paragraph}
                </Text>
              ))}
              
              {pageContent.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: textColor }]}>
                    No content on this page
                  </Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>

          {/* Left tap zone - previous page */}
          <TouchableOpacity
            style={styles.leftTapZone}
            activeOpacity={0.3}
            onPress={goToPreviousPage}
            disabled={currentPage === 0}
          />

          {/* Right tap zone - next page */}
          <TouchableOpacity
            style={styles.rightTapZone}
            activeOpacity={0.3}
            onPress={goToNextPage}
            disabled={currentPage >= totalPages - 1}
          />
        </View>

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
                {chapterInfo?.title || chapterInfo?.seriesName || 'Reading'}
              </Text>
              <View style={styles.topBarActions}>
                <IconButton
                  icon="format-font-size-decrease"
                  iconColor="#fff"
                  size={20}
                  onPress={() => changeFontSize(-2)}
                />
                <IconButton
                  icon="format-font-size-increase"
                  iconColor="#fff"
                  size={20}
                  onPress={() => changeFontSize(2)}
                />
              </View>
            </View>

            <View style={styles.bottomBar}>
              <ProgressBar
                progress={totalPages > 0 ? (currentPage + 1) / totalPages : 0}
                color={theme.primary}
                style={styles.progressBar}
              />
              <View style={styles.pageInfoRow}>
                <Text style={styles.pageInfo}>
                  Page {currentPage + 1} / {totalPages}
                </Text>
                <Text style={styles.fontSizeIndicator}>
                  Font: {fontSize}px
                </Text>
              </View>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  contentWrapper: {
    flex: 1,
  },
  centerTapZone: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  paragraph: {
    marginBottom: 16,
    textAlign: 'justify',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  leftTapZone: {
    position: 'absolute',
    left: 0,
    top: 100,
    bottom: 100,
    width: SCREEN_WIDTH * 0.3,
  },
  rightTapZone: {
    position: 'absolute',
    right: 0,
    top: 100,
    bottom: 100,
    width: SCREEN_WIDTH * 0.3,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  topBarTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  topBarActions: {
    flexDirection: 'row',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  pageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pageInfo: {
    color: '#fff',
    fontSize: 14,
  },
  fontSizeIndicator: {
    color: '#fff',
    fontSize: 12,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 80,
  },
});