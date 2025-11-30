import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Card, Button, Chip } from 'react-native-paper';
import { Image } from 'expo-image';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SeriesDetail'>;

export default function SeriesDetailScreen({ route, navigation }: Props) {
  const { seriesId } = route.params;
  const [series, setSeries] = useState<any>(null);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const client = useServerStore((state) => state.getActiveClient());
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    loadSeriesData();
  }, []);

  const loadSeriesData = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const [seriesData, volumesData] = await Promise.all([
        client.getSeriesById(seriesId),
        client.getVolumes(seriesId)
      ]);
      
      console.log('Series data:', seriesData);
      console.log('Volumes data:', volumesData);
      
      setSeries(seriesData);
      setVolumes(volumesData);
      navigation.setOptions({ title: seriesData.name });
    } catch (error: any) {
      console.error('Failed to load series:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoverUrl = () => {
    if (!client) return '';
    return client.getCoverImageUrl(seriesId);
  };

  const getVolumeCoverUrl = (volumeId: number) => {
    if (!client) return '';
    return client.getVolumeCoverUrl(volumeId);
  };

  const getProgress = () => {
    if (!series || series.pages === 0) return 0;
    return Math.round((series.pagesRead / series.pages) * 100);
  };

  const handleReadVolume = (volume: any) => {
    if (volume.chapters && volume.chapters.length > 0) {
      const firstChapter = volume.chapters[0];
      navigation.navigate('Reader', { 
        chapterId: firstChapter.id,
        seriesId: seriesId 
      });
    } else {
      alert(`No chapters found in ${volume.name || `Volume ${volume.number}`}`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading series...</Text>
      </View>
    );
  }

  if (!series) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text variant="titleLarge" style={{ color: theme.text }}>Series not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Cover and Info Section */}
      <View style={[styles.heroSection, { backgroundColor: theme.surface }]}>
        <Image
          source={{ uri: getCoverUrl() }}
          style={styles.coverImage}
          contentFit="cover"
        />
        
        <View style={styles.infoSection}>
          <Text variant="headlineMedium" style={[styles.seriesTitle, { color: theme.text }]}>
            {series.name}
          </Text>
          
          {series.summary && (
            <Text variant="bodyMedium" style={[styles.summary, { color: theme.textSecondary }]}>
              {series.summary}
            </Text>
          )}

          <View style={styles.metaRow}>
            <Chip icon="book-open" style={[styles.chip, { backgroundColor: theme.card }]} textStyle={{ color: theme.text }}>
              {series.pages} pages
            </Chip>
            <Chip icon="progress-check" style={[styles.chip, { backgroundColor: theme.card }]} textStyle={{ color: theme.text }}>
              {getProgress()}% read
            </Chip>
          </View>

          <Button
            mode="contained"
            icon="play"
            style={styles.readButton}
            buttonColor={theme.accent}
            onPress={() => {
              if (volumes.length > 0) {
                handleReadVolume(volumes[0]);
              } else {
                alert('No volumes available');
              }
            }}
          >
            {series.pagesRead > 0 ? 'Continue Reading' : 'Start Reading'}
          </Button>
        </View>
      </View>

      {/* Volumes and Chapters List */}
      <View style={styles.volumesSection}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.text }]}>
          {volumes.length === 1 && volumes[0].chapters?.length > 1 
            ? 'Chapters' 
            : 'Volumes & Chapters'}
        </Text>
        
        {volumes.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
            <Card.Content>
              <Text style={{ color: theme.text }}>No volumes available</Text>
            </Card.Content>
          </Card>
        ) : (
          volumes.map((volume) => (
            <View key={volume.id} style={styles.volumeContainer}>
              {/* Volume Header - only show if there are multiple volumes */}
              {volumes.length > 1 && (
                <Card style={[styles.volumeCard, { backgroundColor: theme.surface }]}>
                  <TouchableOpacity onPress={() => handleReadVolume(volume)}>
                    <Card.Content>
                      <View style={styles.volumeHeader}>
                        <Image
                          source={{ uri: getVolumeCoverUrl(volume.id) }}
                          style={styles.volumeCover}
                          contentFit="cover"
                        />
                        <View style={styles.volumeInfo}>
                          <Text variant="titleMedium" style={[styles.volumeName, { color: theme.text }]}>
                            {volume.name || `Volume ${volume.number}`}
                          </Text>
                          <Text variant="bodySmall" style={[styles.volumeMeta, { color: theme.textSecondary }]}>
                            {volume.chapters?.length || 0} chapters • {volume.pages} pages
                          </Text>
                          {volume.pagesRead > 0 && (
                            <View style={styles.progressBarContainer}>
                              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                                <View 
                                  style={[
                                    styles.progressFill, 
                                    { 
                                      width: `${Math.round((volume.pagesRead / volume.pages) * 100)}%`,
                                      backgroundColor: theme.primary
                                    }
                                  ]} 
                                />
                              </View>
                              <Text variant="bodySmall" style={[styles.progressText, { color: theme.textSecondary }]}>
                                {Math.round((volume.pagesRead / volume.pages) * 100)}%
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Card.Content>
                  </TouchableOpacity>
                </Card>
              )}

              {/* Chapters List */}
              {volume.chapters && volume.chapters.length > 0 && (
                <View style={styles.chaptersContainer}>
                  {volume.chapters.map((chapter: any) => (
                    <Card key={chapter.id} style={[styles.chapterCard, { backgroundColor: theme.surface }]}>
                      <TouchableOpacity 
                        onPress={() => {
                          navigation.navigate('Reader', {
                            chapterId: chapter.id,
                            seriesId: seriesId
                          });
                        }}
                      >
                        <Card.Content>
                          <View style={styles.chapterRow}>
                            <View style={styles.chapterInfo}>
                              <Text variant="bodyLarge" style={[styles.chapterTitle, { color: theme.text }]}>
                                {chapter.title || chapter.titleName || chapter.range || `Chapter ${chapter.number}`}
                              </Text>
                              <Text variant="bodySmall" style={[styles.chapterMeta, { color: theme.textSecondary }]}>
                                {chapter.pages} pages
                                {chapter.pagesRead > 0 && ` • ${chapter.pagesRead} read`}
                              </Text>
                            </View>
                            {chapter.pagesRead > 0 && chapter.pagesRead < chapter.pages && (
                              <Chip mode="outlined" compact style={[styles.inProgressChip, { borderColor: theme.warning, backgroundColor: `${theme.warning}20` }]}>
                                In Progress
                              </Chip>
                            )}
                            {chapter.pagesRead === chapter.pages && (
                              <Chip mode="outlined" compact style={[styles.completedChip, { borderColor: theme.success, backgroundColor: `${theme.success}20` }]}>
                                ✓ Read
                              </Chip>
                            )}
                          </View>
                        </Card.Content>
                      </TouchableOpacity>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
  },
  heroSection: {
    paddingBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E0E0E0',
  },
  infoSection: {
    padding: 16,
  },
  seriesTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summary: {
    marginBottom: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
  },
  readButton: {
  },
  volumesSection: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  volumeContainer: {
    marginBottom: 16,
  },
  volumeCard: {
    marginBottom: 12,
  },
  volumeHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  volumeCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  volumeInfo: {
    flex: 1,
  },
  volumeName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  volumeMeta: {
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    minWidth: 35,
  },
  chaptersContainer: {
    gap: 8,
  },
  chapterCard: {
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterInfo: {
    flex: 1,
    marginRight: 8,
  },
  chapterTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  chapterMeta: {
  },
  inProgressChip: {
  },
  completedChip: {
  },
  emptyCard: {
  },
});