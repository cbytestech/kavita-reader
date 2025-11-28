import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, ActivityIndicator, Button, Searchbar } from 'react-native-paper';
import { useServerStore } from '../stores/serverStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [libraries, setLibraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const client = useServerStore((state) => state.getActiveClient());

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
      case 0: return '📚';
      case 1: return '🦸';
      case 2: return '📖';
      default: return '📁';
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your libraries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with SafeArea */}
      <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            My Libraries
          </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Connect')}
            icon="logout"
          >
            Logout
          </Button>
        </View>
      </SafeAreaView>

      {/* Search Bar - No extra spacing */}
      <Searchbar
        placeholder="Search series..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Libraries
          </Text>
          
          {libraries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="titleMedium">No libraries found</Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
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
                  <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                      <Text style={styles.libraryIcon}>
                        {getLibraryIcon(library.type)}
                      </Text>
                      <Text variant="titleMedium" style={styles.libraryName} numberOfLines={2}>
                        {library.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.libraryType}>
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
    backgroundColor: '#FAFAFA',
  },
  safeAreaHeader: {
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  libraryIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  libraryName: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  libraryType: {
    color: '#666',
  },
  emptyCard: {
    backgroundColor: '#fff',
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
  },
});