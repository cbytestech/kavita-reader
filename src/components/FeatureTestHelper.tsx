// src/components/FeatureTestHelper.tsx
// Temporary component to test if new features are loaded
// Add this to your HomeScreen temporarily to verify features are working

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';

export default function FeatureTestHelper() {
  const getAllClients = useServerStore((state) => state.getAllClients);
  const searchSeriesAcrossServers = useServerStore((state) => state.searchSeriesAcrossServers);
  const servers = useServerStore((state) => state.servers);
  const theme = useThemeStore((state) => state.theme);

  const checkFeatures = () => {
    const results = {
      multiServerStore: typeof getAllClients === 'function',
      searchAcrossServers: typeof searchSeriesAcrossServers === 'function',
      serverCount: servers.length,
    };
    return results;
  };

  const features = checkFeatures();

  return (
    <Card style={[styles.card, { backgroundColor: theme.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={[styles.title, { color: theme.text }]}>
          🔧 Feature Check
        </Text>
        
        <View style={styles.row}>
          <Text style={{ color: theme.text }}>Multi-Server Store:</Text>
          <Chip 
            style={{ backgroundColor: features.multiServerStore ? theme.success : theme.error }}
            textStyle={{ color: '#fff' }}
          >
            {features.multiServerStore ? '✓ Loaded' : '✗ Missing'}
          </Chip>
        </View>

        <View style={styles.row}>
          <Text style={{ color: theme.text }}>Search Across Servers:</Text>
          <Chip 
            style={{ backgroundColor: features.searchAcrossServers ? theme.success : theme.error }}
            textStyle={{ color: '#fff' }}
          >
            {features.searchAcrossServers ? '✓ Loaded' : '✗ Missing'}
          </Chip>
        </View>

        <View style={styles.row}>
          <Text style={{ color: theme.text }}>Connected Servers:</Text>
          <Chip 
            style={{ backgroundColor: theme.primary }}
            textStyle={{ color: '#fff' }}
          >
            {features.serverCount}
          </Chip>
        </View>

        <Text variant="bodySmall" style={[styles.hint, { color: theme.textSecondary }]}>
          {features.multiServerStore && features.searchAcrossServers
            ? '✅ All new features loaded successfully!'
            : '⚠️ Some features missing - check if you updated serverStore.ts'}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hint: {
    marginTop: 12,
    fontStyle: 'italic',
  },
});