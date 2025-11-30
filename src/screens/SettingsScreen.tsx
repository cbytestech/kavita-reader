// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Switch, Card, Divider, List, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';

export default function SettingsScreen({ navigation }: any) {
  const [showAbout, setShowAbout] = useState(false);
  
  const servers = useServerStore((state) => state.servers);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);
  const isGrayscaleReading = useThemeStore((state) => state.isGrayscaleReading);
  const toggleGrayscaleReading = useThemeStore((state) => state.toggleGrayscaleReading);
  const pageTurnSoundsEnabled = useThemeStore((state) => state.pageTurnSoundsEnabled);
  const togglePageTurnSounds = useThemeStore((state) => state.togglePageTurnSounds);
  const theme = useThemeStore((state) => state.theme);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Coming soon! Use the Connect screen to manage servers.',
      [{ text: 'OK' }]
    );
  };

  const openKavitaWebsite = () => {
    Linking.openURL('https://www.kavitareader.com/');
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      edges={['top']}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.text }]}>
            Settings
          </Text>
        </View>

        {/* Appearance Section */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Appearance
            </Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingTitleRow}>
                  <IconButton
                    icon={isDarkMode ? 'weather-night' : 'weather-sunny'}
                    size={20}
                    iconColor={theme.primary}
                    style={styles.settingIcon}
                  />
                  <Text variant="bodyLarge" style={{ color: theme.text }}>Dark Mode</Text>
                </View>
                <Text variant="bodySmall" style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
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

        {/* Reader Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Reading Experience
            </Text>
            
            {/* Grayscale Reading */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingTitleRow}>
                  <IconButton
                    icon="palette-outline"
                    size={20}
                    iconColor={theme.primary}
                    style={styles.settingIcon}
                  />
                  <Text variant="bodyLarge" style={{ color: theme.text }}>Grayscale Reading</Text>
                </View>
                <Text variant="bodySmall" style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Reduces eye strain and saves battery while reading
                </Text>
              </View>
              <Switch
                value={isGrayscaleReading}
                onValueChange={toggleGrayscaleReading}
                color={theme.primary}
              />
            </View>

            <Divider style={[styles.settingDivider, { backgroundColor: theme.border }]} />

            {/* Page Turn Sounds */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingTitleRow}>
                  <IconButton
                    icon={pageTurnSoundsEnabled ? 'volume-high' : 'volume-off'}
                    size={20}
                    iconColor={theme.primary}
                    style={styles.settingIcon}
                  />
                  <Text variant="bodyLarge" style={{ color: theme.text }}>Page Turn Sounds</Text>
                </View>
                <Text variant="bodySmall" style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Play a subtle sound when turning pages
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

        {/* Server Info */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.text }]}>
              Connected Servers
            </Text>
            {servers.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                No servers connected
              </Text>
            ) : (
              servers.map((server) => (
                <List.Item
                  key={server.id}
                  title={server.name}
                  description={server.url}
                  left={props => <List.Icon {...props} icon="server" color={theme.primary} />}
                  titleStyle={{ color: theme.text }}
                  descriptionStyle={{ color: theme.textSecondary }}
                />
              ))
            )}
          </Card.Content>
        </Card>

        {/* About Section */}
        <Card style={[styles.card, { backgroundColor: theme.surface }]}>
          <Card.Content>
            <List.Item
              title="About"
              description="Learn about this app"
              left={props => <List.Icon {...props} icon="information" color={theme.primary} />}
              right={props => <List.Icon {...props} icon={showAbout ? "chevron-up" : "chevron-down"} color={theme.textSecondary} />}
              onPress={() => setShowAbout(!showAbout)}
              titleStyle={{ color: theme.text }}
              descriptionStyle={{ color: theme.textSecondary }}
            />
            
            {showAbout && (
              <View style={styles.aboutContent}>
                <Divider style={[styles.divider, { backgroundColor: theme.border }]} />
                
                <View style={styles.giftHeader}>
                  <IconButton
                    icon="gift"
                    size={32}
                    iconColor={theme.accent}
                  />
                  <Text variant="titleMedium" style={[styles.aboutTitle, { color: theme.primary }]}>
                    A Christmas Gift for Emily
                  </Text>
                </View>
                
                <Text variant="bodyMedium" style={[styles.aboutText, { color: theme.text }]}>
                  This app was created with love as a Christmas 2025 gift for Emily, 
                  so she could enjoy her digital library anywhere, anytime.
                </Text>

                <View style={styles.subsectionHeader}>
                  <IconButton
                    icon="compass"
                    size={20}
                    iconColor={theme.primary}
                    style={styles.subsectionIcon}
                  />
                  <Text variant="titleSmall" style={[styles.subsectionTitle, { color: theme.text }]}>
                    The Journey
                  </Text>
                </View>
                <Text variant="bodyMedium" style={[styles.aboutText, { color: theme.text }]}>
                  Built by Nicholas with assistance from Claude (Anthropic's AI assistant), 
                  this project started with minimal coding experience and grew into a 
                  fully-featured reading app through determination, late nights, 
                  and countless cups of coffee.
                </Text>

                <View style={styles.subsectionHeader}>
                  <IconButton
                    icon="home-heart"
                    size={20}
                    iconColor={theme.primary}
                    style={styles.subsectionIcon}
                  />
                  <Text variant="titleSmall" style={[styles.subsectionTitle, { color: theme.text }]}>
                    Hess Homestead
                  </Text>
                </View>
                <Text variant="bodyMedium" style={[styles.aboutText, { color: theme.text }]}>
                  Branded with the Hess Homestead logo, established 2025, 
                  representing our journey of building a home and family together.
                </Text>

                <View style={styles.subsectionHeader}>
                  <IconButton
                    icon="account-heart"
                    size={20}
                    iconColor={theme.primary}
                    style={styles.subsectionIcon}
                  />
                  <Text variant="titleSmall" style={[styles.subsectionTitle, { color: theme.text }]}>
                    Special Thanks
                  </Text>
                </View>
                <Text variant="bodyMedium" style={[styles.aboutText, { color: theme.text }]}>
                  <IconButton icon="heart" size={16} iconColor={theme.accent} style={styles.inlineIcon} />
                  <Text style={[styles.bold, { color: theme.primary }]}>Emily</Text> - The inspiration and reason for this app{'\n'}
                  <IconButton icon="robot" size={16} iconColor={theme.accent} style={styles.inlineIcon} />
                  <Text style={[styles.bold, { color: theme.primary }]}>Claude</Text> - AI pair programming partner who guided every step{'\n'}
                  <IconButton icon="book-open-variant" size={16} iconColor={theme.accent} style={styles.inlineIcon} />
                  <Text style={[styles.bold, { color: theme.primary }]}>Kavita Team</Text> - For creating the amazing server platform{'\n'}
                  <IconButton icon="account-star" size={16} iconColor={theme.accent} style={styles.inlineIcon} />
                  <Text style={[styles.bold, { color: theme.primary }]}>You</Text> - For using this labor of love
                </Text>

                <View style={styles.subsectionHeader}>
                  <IconButton
                    icon="cog"
                    size={20}
                    iconColor={theme.primary}
                    style={styles.subsectionIcon}
                  />
                  <Text variant="titleSmall" style={[styles.subsectionTitle, { color: theme.text }]}>
                    Technical Details
                  </Text>
                </View>
                <Text variant="bodyMedium" style={[styles.aboutText, { color: theme.text }]}>
                  Built with React Native, TypeScript, and Expo. Features include 
                  multi-server support, PDF/EPUB reading, progress sync, and more.
                </Text>

                <View style={[styles.versionBadge, { backgroundColor: theme.card }]}>
                  <IconButton icon="information-outline" size={16} iconColor={theme.textSecondary} />
                  <Text variant="bodySmall" style={[styles.versionText, { color: theme.textTertiary }]}>
                    Version 1.0.0 • Christmas 2025 Edition
                  </Text>
                </View>

                <Button
                  mode="outlined"
                  onPress={openKavitaWebsite}
                  style={[styles.linkButton, { borderColor: theme.primary }]}
                  textColor={theme.primary}
                  icon="open-in-new"
                >
                  Visit Kavita Website
                </Button>

                <View style={styles.madeWithLove}>
                  <IconButton icon="heart" size={16} iconColor="#FF6B6B" />
                  <Text variant="bodySmall" style={[styles.footerText, { color: theme.textTertiary }]}>
                    Made with love for Emily
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: theme.error }]}
            textColor={theme.error}
            icon="logout"
          >
            Logout
          </Button>
        </View>

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
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingIcon: {
    margin: 0,
    marginRight: 8,
  },
  settingDescription: {
    marginTop: 2,
    marginLeft: 48,
  },
  settingDivider: {
    marginVertical: 12,
  },
  aboutContent: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aboutTitle: {
    fontWeight: '600',
    flex: 1,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subsectionIcon: {
    margin: 0,
    marginRight: 4,
  },
  subsectionTitle: {
    fontWeight: '600',
  },
  aboutText: {
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
  },
  inlineIcon: {
    margin: 0,
    padding: 0,
    width: 16,
    height: 16,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
    borderRadius: 8,
  },
  versionText: {
    fontStyle: 'italic',
  },
  linkButton: {
    marginTop: 16,
  },
  madeWithLove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontStyle: 'italic',
  },
  actionsSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  logoutButton: {
  },
  bottomSpacer: {
    height: 40,
  },
});