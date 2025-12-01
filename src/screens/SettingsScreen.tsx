// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Switch, Button, IconButton, Divider, List, Chip } from 'react-native-paper';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const servers = useServerStore((state) => state.servers);
  const primaryServerId = useServerStore((state) => state.primaryServerId);
  const setPrimaryServer = useServerStore((state) => state.setPrimaryServer);
  const removeServer = useServerStore((state) => state.removeServer);
  
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);
  const isGrayscaleReading = useThemeStore((state) => state.isGrayscaleReading);
  const toggleGrayscaleReading = useThemeStore((state) => state.toggleGrayscaleReading);
  const pageTurnSoundsEnabled = useThemeStore((state) => state.pageTurnSoundsEnabled);
  const togglePageTurnSounds = useThemeStore((state) => state.togglePageTurnSounds);
  const theme = useThemeStore((state) => state.theme);

  const [expandedServers, setExpandedServers] = useState(false);

  const handleRemoveServer = (serverId: string, serverName: string) => {
    Alert.alert(
      'Remove Server',
      `Are you sure you want to remove "${serverName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            removeServer(serverId);
            if (servers.length === 1) {
              // Last server removed, go back to connect screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Connect' }],
              });
            }
          }
        },
      ]
    );
  };

  const handleAddServer = () => {
    navigation.navigate('Connect');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from all servers?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Remove all servers
            servers.forEach(server => removeServer(server.id));
            navigation.reset({
              index: 0,
              routes: [{ name: 'Connect' }],
            });
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* App Info */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.text }]}>
            Settings
          </Text>
        </View>

        {/* Appearance Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Appearance
            </Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={{ color: theme.text }}>
                  Dark Mode
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  Use dark theme throughout the app
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                color={theme.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Reading Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Reading
            </Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={{ color: theme.text }}>
                  Grayscale Mode
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  Reduce eye strain with grayscale filter
                </Text>
              </View>
              <Switch
                value={isGrayscaleReading}
                onValueChange={toggleGrayscaleReading}
                color={theme.primary}
              />
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={{ color: theme.text }}>
                  Page Turn Sounds
                </Text>
                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                  Play sound when turning pages
                </Text>
              </View>
              <Switch
                value={pageTurnSoundsEnabled}
                onValueChange={togglePageTurnSounds}
                color={theme.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Servers */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
                Servers ({servers.length})
              </Text>
              <IconButton
                icon={expandedServers ? 'chevron-up' : 'chevron-down'}
                size={20}
                onPress={() => setExpandedServers(!expandedServers)}
                iconColor={theme.textSecondary}
              />
            </View>

            {expandedServers && (
              <>
                {servers.map((server, index) => (
                  <View key={server.id}>
                    {index > 0 && <Divider style={[styles.divider, { backgroundColor: theme.border }]} />}
                    <View style={styles.serverRow}>
                      <View style={styles.serverInfo}>
                        <View style={styles.serverTitleRow}>
                          <Text variant="bodyLarge" style={{ color: theme.text }}>
                            {server.name}
                          </Text>
                          {server.id === primaryServerId && (
                            <Chip 
                              style={[styles.primaryChip, { backgroundColor: theme.primaryLight }]}
                              textStyle={{ color: '#fff', fontSize: 11 }}
                              compact
                            >
                              Primary
                            </Chip>
                          )}
                        </View>
                        <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                          {server.url.replace(/^https?:\/\//, '')}
                        </Text>
                      </View>
                      <View style={styles.serverActions}>
                        {server.id !== primaryServerId && (
                          <IconButton
                            icon="star-outline"
                            size={20}
                            onPress={() => setPrimaryServer(server.id)}
                            iconColor={theme.textSecondary}
                          />
                        )}
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          onPress={() => handleRemoveServer(server.id, server.name)}
                          iconColor={theme.error}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <Divider style={[styles.divider, { backgroundColor: theme.border }]} />

                <Button
                  mode="outlined"
                  onPress={handleAddServer}
                  icon="plus"
                  style={styles.addServerButton}
                  textColor={theme.primary}
                >
                  Add Another Server
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              About
            </Text>
            
            <View style={styles.aboutRow}>
              <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                Version
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.text }}>
                1.0.0
              </Text>
            </View>

            <View style={styles.aboutRow}>
              <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                Connected Servers
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.text }}>
                {servers.length}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Logout */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              buttonColor={theme.error}
              textColor="#fff"
              icon="logout"
            >
              Logout from All Servers
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  divider: {
    marginVertical: 12,
  },
  serverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  serverInfo: {
    flex: 1,
    gap: 4,
  },
  serverTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryChip: {
    height: 20,
  },
  serverActions: {
    flexDirection: 'row',
  },
  addServerButton: {
    marginTop: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  bottomSpacer: {
    height: 24,
  },
});