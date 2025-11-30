// src/screens/ConnectScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Text, ActivityIndicator, Divider, SegmentedButtons, IconButton } from 'react-native-paper';
import { KavitaClient } from '../api/kavitaClient';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Connect'>;

export default function ConnectScreen({ navigation }: Props) {
  const [connectionType, setConnectionType] = useState('ip');
  const [serverAddress, setServerAddress] = useState('');
  const [port, setPort] = useState('5000');
  const [opdsUrl, setOpdsUrl] = useState('');
  const [useHttps, setUseHttps] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const addServer = useServerStore((state) => state.addServer);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);
  const theme = useThemeStore((state) => state.theme);

  const buildServerUrl = (): string => {
    if (connectionType === 'opds') {
      return opdsUrl.trim();
    }

    let cleanAddress = serverAddress.trim();
    cleanAddress = cleanAddress.replace(/^https?:\/\//, '');
    cleanAddress = cleanAddress.replace(/\/$/, '');
    cleanAddress = cleanAddress.replace(/:\d+$/, '');

    const protocol = useHttps ? 'https' : 'http';
    return `${protocol}://${cleanAddress}:${port}`;
  };

  const handleConnect = async () => {
    if (connectionType === 'ip') {
      if (!serverAddress.trim()) {
        Alert.alert('Error', 'Please enter a server address');
        return;
      }
      if (!port.trim() || isNaN(Number(port))) {
        Alert.alert('Error', 'Please enter a valid port number');
        return;
      }
    } else {
      if (!opdsUrl.trim()) {
        Alert.alert('Error', 'Please enter an OPDS URL');
        return;
      }
    }

    setLoading(true);
    
    try {
      const serverUrl = buildServerUrl();
      const client = new KavitaClient(serverUrl);
      const isConnected = await client.testConnection();
      
      if (!isConnected) {
        Alert.alert(
          'Connection Failed', 
          'Cannot reach the server. Please check:\n\n' +
          '• Server is running\n' +
          '• Address and port are correct\n' +
          '• You\'re on the same network\n' +
          (connectionType === 'ip' ? `• Try toggling HTTP/HTTPS\n\nAttempted: ${serverUrl}` : '')
        );
        setLoading(false);
        return;
      }

      navigation.navigate('Login', { serverUrl });
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    Alert.alert(
      'Demo Mode',
      'This will let you explore the app with sample content.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Try Demo', 
          onPress: () => {
            addServer({
              name: 'Demo Library',
              url: 'https://demo.kavitareader.com',
              type: 'kavita',
              isDefault: true,
            });
            navigation.navigate('Home');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Dark Mode Toggle - Top Right */}
        <View style={styles.topBar}>
          <IconButton
            icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
            size={24}
            iconColor={theme.primary}
            onPress={toggleDarkMode}
          />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🏡</Text>
            </View>

            {/* Title */}
            <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
              KavitaReader
            </Text>
            
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Connect to your Kavita library
            </Text>

            {/* Connection Type Selector */}
            <SegmentedButtons
              value={connectionType}
              onValueChange={setConnectionType}
              buttons={[
                { value: 'ip', label: 'IP Address', icon: 'ip-network' },
                { value: 'opds', label: 'OPDS URL', icon: 'link' },
              ]}
              style={styles.segmentedButtons}
              theme={{ colors: { secondaryContainer: theme.primaryLight } }}
            />

            {/* IP Address Mode */}
            {connectionType === 'ip' && (
              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>
                  Server Address
                </Text>
                
                <TextInput
                  value={serverAddress}
                  onChangeText={setServerAddress}
                  placeholder="192.168.1.100 or myserver.com"
                  mode="outlined"
                  style={[styles.input, { backgroundColor: theme.surface }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  left={<TextInput.Icon icon="server" />}
                  disabled={loading}
                  textColor={theme.text}
                  placeholderTextColor={theme.textTertiary}
                />

                <View style={styles.portContainer}>
                  <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>
                    Port
                  </Text>
                  <View style={styles.portSpinnerContainer}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        const currentPort = parseInt(port) || 5000;
                        if (currentPort > 1) setPort(String(currentPort - 1));
                      }}
                      disabled={loading}
                      style={[styles.portButton, { borderColor: theme.primary }]}
                      textColor={theme.primary}
                      compact
                    >
                      -
                    </Button>
                    <TextInput
                      value={port}
                      onChangeText={(text) => {
                        const num = text.replace(/[^0-9]/g, '');
                        if (num === '' || (parseInt(num) >= 1 && parseInt(num) <= 65535)) {
                          setPort(num || '5000');
                        }
                      }}
                      mode="outlined"
                      keyboardType="numeric"
                      style={[styles.portInputCenter, { backgroundColor: theme.surface }]}
                      disabled={loading}
                      textColor={theme.text}
                    />
                    <Button
                      mode="outlined"
                      onPress={() => {
                        const currentPort = parseInt(port) || 5000;
                        if (currentPort < 65535) setPort(String(currentPort + 1));
                      }}
                      disabled={loading}
                      style={[styles.portButton, { borderColor: theme.primary }]}
                      textColor={theme.primary}
                      compact
                    >
                      +
                    </Button>
                  </View>
                </View>

                <View style={styles.httpsContainer}>
                  <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>
                    Protocol
                  </Text>
                  <SegmentedButtons
                    value={useHttps ? 'https' : 'http'}
                    onValueChange={(value) => setUseHttps(value === 'https')}
                    buttons={[
                      { value: 'http', label: 'HTTP' },
                      { value: 'https', label: 'HTTPS' },
                    ]}
                    style={styles.protocolButtons}
                    density="small"
                  />
                </View>
                
                <Text variant="bodySmall" style={[styles.hint, { color: theme.textTertiary }]}>
                  Default Kavita port is 5000. Protocol is usually HTTP for local networks.
                </Text>

                <View style={[styles.previewContainer, { backgroundColor: theme.card }]}>
                  <Text variant="bodySmall" style={[styles.previewLabel, { color: theme.primary }]}>
                    Will connect to:
                  </Text>
                  <Text variant="bodyMedium" style={[styles.previewUrl, { color: theme.text }]}>
                    {serverAddress ? buildServerUrl() : 'Enter server address above'}
                  </Text>
                </View>
              </View>
            )}

            {/* OPDS Mode */}
            {connectionType === 'opds' && (
              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>
                  OPDS Feed URL
                </Text>
                
                <TextInput
                  value={opdsUrl}
                  onChangeText={setOpdsUrl}
                  placeholder="https://example.com/api/opds/..."
                  mode="outlined"
                  style={[styles.input, { backgroundColor: theme.surface }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  left={<TextInput.Icon icon="rss" />}
                  disabled={loading}
                  textColor={theme.text}
                  placeholderTextColor={theme.textTertiary}
                />
                
                <Text variant="bodySmall" style={[styles.hint, { color: theme.textTertiary }]}>
                  Paste the full OPDS feed URL from your Kavita server settings.
                </Text>
              </View>
            )}

            {/* Connect Button */}
            <Button
              mode="contained"
              onPress={handleConnect}
              disabled={loading}
              style={styles.connectButton}
              buttonColor={theme.accent}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Connecting...' : 'Connect Server'}
            </Button>

            {loading && <ActivityIndicator style={styles.loader} color={theme.primary} />}

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <Divider style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text variant="labelMedium" style={[styles.dividerText, { color: theme.textSecondary }]}>
                DEMO MODE
              </Text>
              <Divider style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>

            {/* Demo Mode Button */}
            <Button
              mode="outlined"
              onPress={handleDemoMode}
              style={[styles.demoButton, { borderColor: theme.textSecondary }]}
              textColor={theme.textSecondary}
              contentStyle={styles.buttonContent}
            >
              Try Demo Library
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    marginBottom: 12,
  },
  portContainer: {
    marginBottom: 12,
  },
  portSpinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portButton: {
    minWidth: 48,
  },
  portInputCenter: {
    flex: 1,
    textAlign: 'center',
  },
  httpsContainer: {
    marginBottom: 6,
  },
  protocolButtons: {
  },
  hint: {
    fontSize: 11,
    marginBottom: 10,
  },
  previewContainer: {
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  previewLabel: {
    marginBottom: 3,
    fontSize: 11,
  },
  previewUrl: {
    fontWeight: '500',
    fontSize: 13,
  },
  connectButton: {
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  loader: {
    marginVertical: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontWeight: '500',
    fontSize: 11,
  },
  demoButton: {
    marginBottom: 20,
  },
});