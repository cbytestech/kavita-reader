import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, ActivityIndicator, Searchbar, IconButton } from 'react-native-paper';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [libraries, setLibraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const client = useServerStore((state) => state.getActiveClient());
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    loadLibraries();
  }, []);

  const loadLibraries = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const libs = await client.getLibraries();
      setLibraries(libs);
    } catch (error: any) {
      console.error('Failed to load libraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLibraryIcon = (type: number) => {
    switch (type) {
      case 0: return 'book-open-page-variant'; // Manga
      case 1: return 'book-open-variant'; // Comic
      case 2: return 'book'; // Book
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

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading your libraries...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Searchbar
        placeholder="Search series..."
        onChangeText={setSearchQuery}
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
              {libraries.map((library) => (
                <TouchableOpacity
                  key={library.id}
                  style={styles.libraryCard}
                  onPress={() => navigation.navigate('LibraryDetail', { 
                    libraryId: library.id, 
                    libraryName: library.name 
                  })}
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
              ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
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