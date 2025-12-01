// src/screens/SeriesDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, ActivityIndicator, Card, Chip, IconButton } from 'react-native-paper';
import { Image } from 'expo-image';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import { createScreenLogger } from '../utils/debugLogger';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SeriesDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const logger = createScreenLogger('SeriesDetailScreen');

export default function SeriesDetailScreen({ route, navigation }: Props) {
  const { seriesId } = route.params;
  
  logger.render('component render');
  logger.info(`Series ID: ${seriesId}`);
  
  const [series, setSeries] = useState<any>(null);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const client = useServerStore((state) => state.getActiveClient());
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    logger.effect('Component mounted');
    loadSeriesDetails();
  }, []);

  const loadSeriesDetails = async () => {
    if (!client) {
      logger.error('No client available');
      return;
    }
    
    logger.function('loadSeriesDetails', 'Starting');
    setLoading(true);
    
    try {
      logger.function('loadSeriesDetails', `Fetching series ${seriesId}`);
      const [seriesData, volumesData] = await Promise.all([
        client.getSeriesById(seriesId),
        client.getVolumes(seriesId)
      ]);
      
      logger.success(`Loaded series: ${seriesData.name}`);
      logger.info(`Found ${volumesData.length} volumes`);
      
      // Log volume structure for debugging
      volumesData.forEach((vol, idx) => {
        logger.info(`Volume ${idx}: name="${vol.name}", chapters=${vol.chapters?.length || 0}`);
      });
      
      setSeries(seriesData);
      setVolumes(volumesData);
    } catch (error: any) {
      logger.error('Failed to load series details', error.message);
      Alert.alert('Error', 'Failed to load series details');
    } finally {
      setLoading(false);
      logger.function('loadSeriesDetails', 'Complete');
    }
  };

  const getCoverUrl = (volumeId: number) => {
    if (!client) return '';
    return client.getVolumeCoverUrl(volumeId);
  };

  const getChapterCoverUrl = (chapterId: number) => {
    if (!client) return '';
    return client.getChapterCoverUrl(chapterId);
  };

  const getFileExtension = (fileName: string): string => {
    if (!fileName || typeof fileName !== 'string') return '';
    const match = fileName.match(/\.([^.]+)$/);
    return match ? match[1].toUpperCase() : '';
  };

  const getFileTypeLabel = (chapter: any): string => {
    // Try fileName first
    if (chapter.fileName && typeof chapter.fileName === 'string') {
      const ext = getFileExtension(chapter.fileName);
      if (ext) return ext;
      
      const lowerName = chapter.fileName.toLowerCase();
      if (lowerName.includes('epub')) return 'EPUB';
      if (lowerName.includes('pdf')) return 'PDF';
      if (lowerName.includes('cbz') || lowerName.includes('zip')) return 'CBZ';
      if (lowerName.includes('cbr') || lowerName.includes('rar')) return 'CBR';
      if (lowerName.includes('cb7') || lowerName.includes('7z')) return 'CB7';
    }
    
    // Try format field (Kavita API uses MangaFormat enum)
    // 0 = Unknown, 1 = Archive, 2 = Epub, 3 = Pdf, 4 = Image
    if (chapter.format !== undefined) {
      switch (chapter.format) {
        case 2: return 'EPUB';
        case 3: return 'PDF';
        case 1: return 'CBZ'; // Generic archive
        case 4: return 'Images';
      }
    }
    
    // Fallback: check file extension from chapter.files if available
    if (chapter.files && Array.isArray(chapter.files) && chapter.files.length > 0) {
      const firstFile = chapter.files[0];
      if (typeof firstFile === 'string') {
        const ext = getFileExtension(firstFile);
        if (ext) return ext;
      }
    }
    
    return 'Book';
  };

  const getFileTypeColor = (chapter: any): string => {
    const fileType = getFileTypeLabel(chapter);
    
    switch (fileType) {
      case 'EPUB': return '#9C27B0';
      case 'PDF': return '#F44336';
      case 'CBZ':
      case 'ZIP': return '#2196F3';
      case 'CBR':
      case 'RAR': return '#FF9800';
      case 'CB7':
      case '7Z': return '#4CAF50';
      case 'CBT':
      case 'TAR': return '#00BCD4';
      case 'Images': return '#795548';
      case 'MOBI':
      case 'AZW':
      case 'AZW3': return '#673AB7';
      default: return theme.textSecondary;
    }
  };

  const getFileIcon = (chapter: any): string => {
    const fileType = getFileTypeLabel(chapter);
    
    switch (fileType) {
      case 'EPUB':
      case 'MOBI':
      case 'AZW':
      case 'AZW3': return 'book-open-variant';
      case 'PDF': return 'file-pdf-box';
      case 'CBZ':
      case 'CBR':
      case 'CB7':
      case 'CBT':
      case 'ZIP':
      case 'RAR':
      case '7Z':
      case 'TAR': return 'book-open-page-variant';
      case 'Images': return 'image-multiple';
      default: return 'book';
    }
  };

  const handleChapterPress = async (volume: any, chapter: any) => {
    if (!client) return;
    
    logger.user('Chapter clicked', chapter.titleName || chapter.range);
    
    try {
      logger.function('handleChapterPress', 'Pre-caching chapter');
      await client.cacheChapter(chapter.id);
      logger.success('Chapter cached');
      
      navigation.navigate('Reader', {
        chapterId: chapter.id,
        seriesId: seriesId,
      });
    } catch (error) {
      logger.warn('Cache failed, navigating anyway');
      navigation.navigate('Reader', {
        chapterId: chapter.id,
        seriesId: seriesId,
      });
    }
  };

  // ✅ Smart chapter title that shows filename for books
  const getChapterDisplayTitle = (chapter: any, index: number): string => {
    // If there's a title, use it
    if (chapter.titleName && chapter.titleName !== chapter.range) {
      return chapter.titleName;
    }
    
    // If there's a range, use it
    if (chapter.range && chapter.range !== '0') {
      return `Chapter ${chapter.range}`;
    }
    
    // For books (EPUB/PDF), show the filename without extension
    if (chapter.fileName && typeof chapter.fileName === 'string') {
      const fileName = chapter.fileName.replace(/\.[^/.]+$/, ''); // Remove extension
      if (fileName && fileName !== '0' && !fileName.match(/^\d+$/)) {
        return fileName;
      }
    }
    
    // Fallback
    return `Book ${index + 1}`;
  };

  // ✅ Determine if we should hide the volume header (for loose leaf collections)
  const shouldHideVolumeHeader = (volume: any): boolean => {
    const chapters = volume.chapters || [];
    
    if (!volume.name || typeof volume.name !== 'string') {
      return true;
    }
    
    // Hide if volume name starts with a minus (like "-100000")
    if (volume.name.startsWith('-')) {
      return true;
    }
    
    // Hide if volume name is just a number (positive or negative)
    if (volume.name.match(/^-?\d+$/)) {
      return true;
    }
    
    // Hide if marked as loose leaf
    if (volume.name === '0' || volume.minNumber === 0) {
      return true;
    }
    
    // Hide if there's only 1 chapter and the volume looks auto-generated
    if (chapters.length === 1 && volume.name.match(/^\d+$/)) {
      return true;
    }
    
    return false;
  };

  const renderChapterItem = (volume: any, chapter: any, index: number) => {
    const fileType = getFileTypeLabel(chapter);
    const fileColor = getFileTypeColor(chapter);
    const fileIcon = getFileIcon(chapter);
    const progress = chapter.pagesRead > 0 ? (chapter.pagesRead / chapter.pages) * 100 : 0;
    const displayTitle = getChapterDisplayTitle(chapter, index);
    
    // Debug log the first few chapters to see what data we have
    if (index < 2) {
      logger.info(`Chapter ${index}: format=${chapter.format}, fileName=${chapter.fileName}, fileType=${fileType}`);
    }
    
    return (
      <TouchableOpacity
        key={chapter.id}
        onPress={() => handleChapterPress(volume, chapter)}
      >
        <Card style={[styles.chapterCard, { backgroundColor: theme.surface }]}>
          <Card.Content style={styles.chapterContent}>
            {/* ✅ Show chapter cover for books */}
            <Image
              source={{ uri: getChapterCoverUrl(chapter.id) }}
              style={styles.chapterCover}
              contentFit="cover"
            />
            
            <View style={styles.chapterInfo}>
              <Text variant="bodyLarge" style={[styles.chapterTitle, { color: theme.text }]}>
                {displayTitle}
              </Text>
              
              <View style={styles.chapterMeta}>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  {chapter.pages} pages
                </Text>
                {chapter.pagesRead > 0 && (
                  <>
                    <Text style={{ color: theme.textSecondary }}> • </Text>
                    <Text variant="bodySmall" style={{ color: theme.primary }}>
                      {Math.round(progress)}% read
                    </Text>
                  </>
                )}
              </View>
              
              {progress > 0 && (
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${progress}%`, backgroundColor: theme.primary }
                    ]} 
                  />
                </View>
              )}
              
              {/* ✅ File type chip moved to bottom */}
              <View style={styles.fileTypeRow}>
                <Chip 
                  icon={fileIcon}
                  style={[styles.fileTypeChip, { backgroundColor: fileColor }]}
                  textStyle={{ color: '#fff', fontSize: 12, fontWeight: '600' }}
                  compact={false}
                >
                  {fileType}
                </Chip>
              </View>
            </View>
            
            <IconButton
              icon="chevron-right"
              size={20}
              iconColor={theme.textSecondary}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderVolume = (volume: any) => {
    const chapters = volume.chapters || [];
    const hideHeader = shouldHideVolumeHeader(volume);
    
    return (
      <View key={volume.id} style={styles.volumeSection}>
        {!hideHeader && (
          <View style={styles.volumeHeader}>
            <Image
              source={{ uri: getCoverUrl(volume.id) }}
              style={styles.volumeCover}
              contentFit="cover"
            />
            <View style={styles.volumeInfo}>
              <Text variant="titleMedium" style={[styles.volumeTitle, { color: theme.text }]}>
                {volume.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                {chapters.length} {chapters.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.chaptersList}>
          {chapters.map((chapter: any, index: number) => 
            renderChapterItem(volume, chapter, index)
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    logger.render_phase('Rendering loading state');
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading series...
        </Text>
      </View>
    );
  }

  if (!series) {
    logger.error('Series not found');
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text variant="titleLarge" style={{ color: theme.text }}>
          Series not found
        </Text>
      </View>
    );
  }

  logger.render_phase(`Rendering series: ${series.name}`);
  
  // ✅ Count total items across all volumes
  const totalItems = volumes.reduce((sum, vol) => sum + (vol.chapters?.length || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={[styles.seriesHeader, { backgroundColor: theme.surface }]}>
          <Image
            source={{ uri: client?.getCoverImageUrl(seriesId) }}
            style={styles.seriesCover}
            contentFit="cover"
          />
          <View style={styles.seriesInfo}>
            <Text variant="headlineSmall" style={[styles.seriesTitle, { color: theme.text }]}>
              {series.name}
            </Text>
            {series.summary && (
              <Text variant="bodyMedium" style={[styles.seriesSummary, { color: theme.textSecondary }]}>
                {series.summary}
              </Text>
            )}
            <View style={styles.statsRow}>
              {/* ✅ Show total items instead of volumes for book collections */}
              <Chip 
                icon="book-open-variant" 
                style={{ backgroundColor: theme.primaryLight }}
                textStyle={{ color: '#fff', fontWeight: '600' }}
              >
                {totalItems} {totalItems === 1 ? 'Book' : 'Books'}
              </Chip>
            </View>
          </View>
        </View>

        <View style={styles.volumesContainer}>
          {volumes.map(renderVolume)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  seriesHeader: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  seriesCover: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  seriesInfo: {
    flex: 1,
    gap: 8,
  },
  seriesTitle: {
    fontWeight: '600',
  },
  seriesSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  volumesContainer: {
    padding: 16,
    paddingTop: 8,
  },
  volumeSection: {
    marginBottom: 24,
  },
  volumeHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  volumeCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
  },
  volumeInfo: {
    justifyContent: 'center',
    gap: 4,
  },
  volumeTitle: {
    fontWeight: '600',
  },
  chaptersList: {
    gap: 8,
  },
  chapterCard: {
    elevation: 1,
  },
  chapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  chapterCover: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  chapterInfo: {
    flex: 1,
    gap: 4,
  },
  chapterTitle: {
    fontWeight: '500',
  },
  fileTypeRow: {
    marginTop: 4,
  },
  fileTypeChip: {
    height: 32,
    alignSelf: 'flex-start',
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
  },
});