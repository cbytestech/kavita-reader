import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Keyboard } from 'react-native';
import { Text, ActivityIndicator, Card, Searchbar, Chip } from 'react-native-paper';
import { Image } from 'expo-image';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LibraryDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function LibraryDetailScreen({ route, navigation }: Props) {
  const { libraryId, libraryName } = route.params;
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  
  const client = useServerStore((state) => state.getActiveClient());
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    if (!client) {
      console.log('No client available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading series for library:', libraryId);
      const response = await client.getSeries(libraryId, 0, 100);
      console.log('Series loaded:', response.length);
      setSeries(response);
    } catch (error: any) {
      console.error('Failed to load series:', error);
      console.error('Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCoverUrl = (seriesId: number) => {
    if (!client) return '';
    return client.getCoverImageUrl(seriesId);
  };

  const filteredSeries = series.filter((s) =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedSeries = [...filteredSeries].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    } else {
      return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime();
    }
  });

  const getSeriesInfo = (item: any) => {
    const chapterCount = item.chapterCount || 0;
    const volumeCount = item.volumeCount || 0;
    
    if (chapterCount > 1 && volumeCount === 1) {
      return `${chapterCount} books`;
    } else if (volumeCount > 1) {
      return `${volumeCount} volumes`;
    } else {
      if (item.pagesRead > 0) {
        return `${item.pagesRead}/${item.pages} pages`;
      }
      return `${item.pages} pages`;
    }
  };

  const renderSeriesCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.seriesCard}
      onPress={() => navigation.navigate('SeriesDetail', { seriesId: item.id })}
    >
      <Card style={[styles.card, { backgroundColor: theme.surface }]}>
        <Image
          source={{ uri: getCoverUrl(item.id) }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
        <Card.Content style={styles.cardInfo}>
          <Text variant="bodyMedium" numberOfLines={2} style={[styles.seriesTitle, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={[styles.seriesInfo, { color: theme.textSecondary }]}>
            {getSeriesInfo(item)}
          </Text>
          {item.pagesRead > 0 && (
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(item.pagesRead / item.pages) * 100}%`,
                    backgroundColor: theme.primary
                  }
                ]} 
              />
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading series...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Searchbar
        placeholder="Search in library..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.surface }]}
        onBlur={() => Keyboard.dismiss()}
        iconColor={theme.textSecondary}
        placeholderTextColor={theme.textTertiary}
        inputStyle={{ color: theme.text }}
      />

      <View style={styles.filterRow}>
        <Chip
          selected={sortBy === 'name'}
          onPress={() => {
            Keyboard.dismiss();
            setSortBy('name');
          }}
          style={[styles.chip, { backgroundColor: sortBy === 'name' ? theme.primaryLight : theme.surface }]}
          textStyle={{ color: sortBy === 'name' ? '#fff' : theme.text }}
        >
          A-Z
        </Chip>
        <Chip
          selected={sortBy === 'recent'}
          onPress={() => {
            Keyboard.dismiss();
            setSortBy('recent');
          }}
          style={[styles.chip, { backgroundColor: sortBy === 'recent' ? theme.primaryLight : theme.surface }]}
          textStyle={{ color: sortBy === 'recent' ? '#fff' : theme.text }}
        >
          Recently Added
        </Chip>
      </View>

      {sortedSeries.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text variant="titleLarge" style={{ color: theme.text }}>No series found</Text>
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.textSecondary }]}>
            {searchQuery ? 'Try a different search term' : `This library has ${series.length} items but they may not have loaded correctly.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedSeries}
          renderItem={renderSeriesCard}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.row}
          keyboardShouldPersistTaps="handled"
        />
      )}
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
  },
  gridContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  seriesCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  card: {
    elevation: 2,
  },
  cover: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    backgroundColor: '#E0E0E0',
  },
  cardInfo: {
    paddingTop: 8,
  },
  seriesTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  seriesInfo: {
    marginBottom: 4,
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
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
});