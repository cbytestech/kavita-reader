import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, ActivityIndicator, Searchbar, IconButton } from 'react-native-paper';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import { createScreenLogger } from '../utils/debugLogger';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const logger = createScreenLogger('HomeScreen');

export default function HomeScreen({ navigation }: Props) {
  const lastRenderReason = useRef<string>('initial');
  
  logger.render(lastRenderReason.current);
  
  const [libraries, setLibraries] = useState<any[]>(() => {
    logger.state('Initializing libraries', []);
    return [];
  });
  
  const [loading, setLoading] = useState<boolean>(() => {
    logger.state('Initializing loading', true);
    return true;
  });
  
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    logger.state('Initializing searchQuery', '');
    return '';
  });
  
  logger.state('Current state', { 
    librariesCount: libraries.length, 
    loading, 
    searchQuery 
  });
  
  logger.store('serverStore', 'Calling useServerStore...');
  const client = useServerStore((state) => {
    logger.store('serverStore', 'Selector executing');
    return state.getActiveClient();
  });
  logger.store('serverStore', `Client retrieved: ${!!client}`);
  
  logger.store('themeStore', 'Calling useThemeStore...');
  const theme = useThemeStore((state) => {
    logger.store('themeStore', 'Selector executing');
    return state.theme;
  });
  logger.store('themeStore', `Theme retrieved: ${theme ? Object.keys(theme).length + ' keys' : 'null'}`);

  useEffect(() => {
    logger.effect('Mount effect triggered');
    lastRenderReason.current = 'mount-effect';
    loadLibraries();
    
    return () => {
      logger.effect('Component unmounting');
    };
  }, []);
  
  useEffect(() => {
    logger.effect(`Libraries changed: ${libraries.length} items`);
  }, [libraries]);
  
  useEffect(() => {
    logger.effect(`Loading state changed: ${loading}`);
  }, [loading]);

  const loadLibraries = async () => {
    logger.function('loadLibraries', 'Called');
    
    if (!client) {
      logger.error('No client available');
      return;
    }
    
    logger.function('loadLibraries', 'Setting loading=true');
    setLoading(true);
    lastRenderReason.current = 'loading-started';
    
    try {
      logger.function('loadLibraries', 'Calling client.getLibraries()');
      const libs = await client.getLibraries();
      logger.success(`Libraries received: ${libs.length}`);
      
      logger.function('loadLibraries', 'Updating state with libraries');
      setLibraries(libs);
      lastRenderReason.current = 'libraries-loaded';
      
    } catch (error: any) {
      logger.error('Failed to load libraries', error.message);
      lastRenderReason.current = 'error';
    } finally {
      logger.function('loadLibraries', 'Setting loading=false');
      setLoading(false);
      lastRenderReason.current = 'loading-complete';
      logger.function('loadLibraries', 'Complete');
      logger.separator();
    }
  };

  const getLibraryIcon = (type: number) => {
    switch (type) {
      case 0: return 'book-open-page-variant';
      case 1: return 'book-open-variant';
      case 2: return 'book';
      default: return 'folder';
    }
  };

  const getLibraryTypeName = (type: number) => {
    switch (type) {
      case 0: return 'Manga';
      case 1: return 'Comic';
      case 2: return 'Book';
      default: return 'Library';
    }
  };

  logger.render_phase('Deciding which JSX to render');

  if (loading) {
    logger.render_phase('Rendering LOADING state');
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading your libraries...
        </Text>
      </View>
    );
  }

  logger.render_phase(`Rendering MAIN content (${libraries.length} libraries)`);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Searchbar
        placeholder="Search series..."
        onChangeText={(text) => {
          logger.user('Search query changed', text);
          lastRenderReason.current = 'search-changed';
          setSearchQuery(text);
        }}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.surface }]}
        iconColor={theme.textSecondary}
        placeholderTextColor={theme.textTertiary}
        inputStyle={{ color: theme.text }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.text }]}>
            Libraries
          </Text>
          
          {libraries.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.text }}>No libraries found</Text>
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Add some libraries to your Kavita server to get started!
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.librariesGrid}>
              {libraries.map((library, idx) => {
                if (logger.getRenderCount() <= 5) {
                  logger.render_phase(`Creating library card #${idx}: ${library.name}`);
                }
                return (
                  <TouchableOpacity
                    key={library.id}
                    style={styles.libraryCard}
                    onPress={() => {
                      logger.user('Library clicked', library.name);
                      navigation.navigate('LibraryDetail', { 
                        libraryId: library.id, 
                        libraryName: library.name 
                      });
                    }}
                  >
                    <Card style={[styles.card, { backgroundColor: theme.surface }]}>
                      <Card.Content style={styles.cardContent}>
                        <IconButton
                          icon={getLibraryIcon(library.type)}
                          size={48}
                          iconColor={theme.primary}
                          style={styles.libraryIconButton}
                        />
                        <Text variant="titleMedium" style={[styles.libraryName, { color: theme.text }]} numberOfLines={2}>
                          {library.name}
                        </Text>
                        <Text variant="bodySmall" style={[styles.libraryType, { color: theme.textSecondary }]}>
                          {getLibraryTypeName(library.type)}
                        </Text>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  searchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  librariesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  libraryCard: {
    width: '47%',
  },
  card: {
    elevation: 2,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  libraryIconButton: {
    margin: 0,
  },
  libraryName: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  libraryType: {
  },
  emptyCard: {
    elevation: 2,
  },
  emptyText: {
    marginTop: 8,
  },
});