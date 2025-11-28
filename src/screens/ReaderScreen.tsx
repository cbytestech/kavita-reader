// src/screens/ReaderScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Text, IconButton, ProgressBar } from 'react-native-paper';
import { Image } from 'expo-image';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Pdf from 'react-native-pdf';
import { useServerStore } from '../stores/serverStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ReaderScreen({ route, navigation }: Props) {
  const { chapterId, seriesId } = route.params;
  
  const [chapterInfo, setChapterInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [readingMode, setReadingMode] = useState<'single' | 'double' | 'scroll'>('single');
  const [format, setFormat] = useState<'image' | 'pdf' | 'epub'>('image');
  
  const client = useServerStore((state) => state.getActiveClient());
  const scrollViewRef = useRef<ScrollView>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadChapter();
    
    // Auto-hide controls after 3 seconds
    resetControlsTimeout();
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      // Save progress on unmount
      saveProgress();
    };
  }, []);

  useEffect(() => {
    // Save progress when page changes
    if (currentPage > 0) {
      saveProgressDebounced();
    }
  }, [currentPage]);

  const loadChapter = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const info = await client.getChapterInfo(chapterId);
      console.log('Chapter info:', info);
      
      setChapterInfo(info);
      setTotalPages(info.pages || 0);
      setCurrentPage(info.currentPage || 0);
      
      // Determine format
      if (info.isPdf) {
        setFormat('pdf');
      } else if (info.isEpub) {
        setFormat('epub');
      } else {
        setFormat('image');
      }
      
      // Cache chapter images for better performance
      if (!info.isPdf && !info.isEpub) {
        await client.cacheChapter(chapterId);
      }
      
    } catch (error: any) {
      console.error('Failed to load chapter:', error);
      Alert.alert('Error', 'Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const saveProgressDebounced = (() => {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => saveProgress(), 1000);
    };
  })();

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

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      resetControlsTimeout();
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      resetControlsTimeout();
    } else {
      // Chapter finished
      Alert.alert(
        'Chapter Complete',
        'You\'ve reached the end of this chapter.',
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]
      );
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      resetControlsTimeout();
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSwipe = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const { translationX } = nativeEvent;
      
      // Swipe left = next page (for LTR reading)
      if (translationX < -50) {
        goToNextPage();
      }
      // Swipe right = previous page
      else if (translationX > 50) {
        goToPreviousPage();
      }
    }
  };

  const getImageUrl = (page: number) => {
    if (!client) return '';
    return client.getPageImageUrl(chapterId, page);
  };

  const getPdfUrl = () => {
    if (!client) return '';
    return client.getPdfUrl(chapterId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading chapter...</Text>
      </View>
    );
  }

  const renderImageReader = () => (
    <GestureHandlerRootView style={styles.readerContainer}>
      <PanGestureHandler onHandlerStateChange={handleSwipe}>
        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={styles.touchableArea}
            activeOpacity={1}
            onPress={toggleControls}
          >
            <Image
              source={{ uri: getImageUrl(currentPage) }}
              style={styles.pageImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
          
          {/* Tap zones for navigation - Left/Right thirds of screen */}
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
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );

  const renderPdfReader = () => (
    <View style={styles.pdfContainer}>
      <Pdf
        source={{
          uri: getPdfUrl(),
          cache: true,
        }}
        page={currentPage + 1} // PDF pages are 1-indexed
        onLoadComplete={(numberOfPages) => {
          setTotalPages(numberOfPages);
        }}
        onPageChanged={(page) => {
          setCurrentPage(page - 1); // Convert back to 0-indexed
        }}
        onError={(error) => {
          console.error('PDF Error:', error);
          Alert.alert('Error', 'Failed to load PDF');
        }}
        style={styles.pdf}
        horizontal
        enablePaging
        spacing={0}
      />
      
      <TouchableOpacity
        style={styles.pdfTapZone}
        onPress={toggleControls}
        activeOpacity={1}
      />
    </View>
  );

  const renderScrollReader = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      onScroll={() => {
        setShowControls(false);
      }}
      scrollEventThrottle={16}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
      >
        {Array.from({ length: totalPages }).map((_, index) => (
          <Image
            key={index}
            source={{ uri: getImageUrl(index) }}
            style={styles.scrollPageImage}
            contentFit="contain"
            transition={200}
          />
        ))}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden={!showControls} />
      
      {/* Main reader content */}
      {format === 'pdf' ? (
        renderPdfReader()
      ) : readingMode === 'scroll' ? (
        renderScrollReader()
      ) : (
        renderImageReader()
      )}

      {/* Top Control Bar */}
      {showControls && (
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
          <IconButton
            icon="dots-vertical"
            iconColor="#fff"
            size={24}
            onPress={() => {
              // Show settings menu
              Alert.alert(
                'Reader Settings',
                'Reading mode options',
                [
                  {
                    text: 'Single Page',
                    onPress: () => setReadingMode('single'),
                  },
                  {
                    text: 'Scroll Mode',
                    onPress: () => setReadingMode('scroll'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          />
        </View>
      )}

      {/* Bottom Control Bar */}
      {showControls && (
        <View style={styles.bottomBar}>
          <View style={styles.progressSection}>
            <ProgressBar
              progress={totalPages > 0 ? (currentPage + 1) / totalPages : 0}
              color="#1976D2"
              style={styles.progressBar}
            />
            <Text style={styles.pageInfo}>
              {currentPage + 1} / {totalPages}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  readerContainer: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  touchableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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
  pdfContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  pdf: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pdfTapZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  scrollPageImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    marginBottom: 0,
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
  progressSection: {
    marginBottom: 8,
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
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});