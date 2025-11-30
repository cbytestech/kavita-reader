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
} from 'react-native';
import { Text, IconButton, ProgressBar, Button } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function EpubReaderScreen({ route, navigation }: Props) {
  const { chapterId, seriesId } = route.params;
  
  const [chapterInfo, setChapterInfo] = useState<any>(null);
  const [bookInfo, setBookInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [fontSize, setFontSize] = useState(18);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const client = useServerStore((state) => state.getActiveClient());
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const isGrayscaleReading = useThemeStore((state) => state.isGrayscaleReading);
  const pageTurnSoundsEnabled = useThemeStore((state) => state.pageTurnSoundsEnabled);
  const theme = useThemeStore((state) => state.theme);

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
    if (currentPage > 0 && chapterInfo) {
      const timeout = setTimeout(() => saveProgress(), 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentPage]);

  useEffect(() => {
    if (bookInfo && currentPage >= 0) {
      loadPageContent(currentPage);
    }
  }, [isDarkMode, isGrayscaleReading, fontSize]);

  const loadSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      const { sound: newSound } = await Audio.Sound.createAsync(
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
      console.log(`📄 Starting at page ${startPage + 1} of ${epubInfo.pages}`);
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
      console.log(`📄 Loading page ${page + 1}/${totalPages}`);
      const content = await client.getBookPage(chapterId, page);
      
      const styledContent = wrapContentWithStyles(content);
      setHtmlContent(styledContent);
      setLoading(false);
      
      console.log(`✅ Page ${page + 1} loaded`);
    } catch (error: any) {
      console.error('❌ Failed to load page:', error);
      Alert.alert('Error', 'Failed to load page');
      setLoading(false);
    }
  };

  const wrapContentWithStyles = (content: string): string => {
    const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
    const textColor = isDarkMode ? '#e0e0e0' : '#1a1a1a';
    const linkColor = isDarkMode ? '#64b5f6' : '#1976d2';
    
    const grayscaleFilter = isGrayscaleReading ? 'grayscale(100%)' : 'none';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Georgia', serif;
            font-size: ${fontSize}px;
            line-height: 1.6;
            color: ${textColor};
            background-color: ${backgroundColor};
            padding: 20px;
            filter: ${grayscaleFilter};
          }
          
          p {
            margin-bottom: 1em;
            text-align: justify;
          }
          
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            line-height: 1.3;
            color: ${textColor};
            font-weight: 600;
          }
          
          h1 { font-size: 1.8em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.3em; }
          
          a {
            color: ${linkColor};
            text-decoration: underline;
          }
          
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em auto;
          }
          
          blockquote {
            margin: 1em 0;
            padding-left: 1em;
            border-left: 3px solid ${linkColor};
            font-style: italic;
          }
          
          code {
            background-color: ${isDarkMode ? '#2a2a2a' : '#f5f5f5'};
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }
          
          pre {
            background-color: ${isDarkMode ? '#2a2a2a' : '#f5f5f5'};
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            margin: 1em 0;
          }
          
          ul, ol {
            margin-left: 2em;
            margin-bottom: 1em;
          }
          
          li {
            margin-bottom: 0.5em;
          }
          
          -webkit-user-select: text;
          user-select: text;
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
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
      console.log(`💾 Progress saved: page ${currentPage + 1}`);
    } catch (error) {
      console.error('❌ Failed to save progress:', error);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      playPageTurnSound();
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadPageContent(nextPage);
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
      loadPageContent(prevPage);
    }
  };

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(32, fontSize + delta));
    setFontSize(newSize);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading EPUB...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
      <TouchableOpacity
        style={styles.contentContainer}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          originWhitelist={['*']}
        />
      </TouchableOpacity>

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
              <Text style={styles.fontSizeIndicator}>
                Font: {fontSize}px
              </Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  contentContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  topBarActions: {
    flexDirection: 'row',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontSizeIndicator: {
    color: '#fff',
    fontSize: 12,
  },
});