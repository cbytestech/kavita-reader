// src/screens/ConnectScreen.tsx
// Enhanced version with separate port field for better UX
import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, Divider, SegmentedButtons } from 'react-native-paper';
import { KavitaClient } from '../api/kavitaClient';
import { useServerStore } from '../stores/serverStore';
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

  const buildServerUrl = (): string => {
    if (connectionType === 'opds') {
      return opdsUrl.trim();
    }

    // For IP/domain connections
    let cleanAddress = serverAddress.trim();
    
    // Remove any http:// or https:// if user added it
    cleanAddress = cleanAddress.replace(/^https?:\/\//, '');
    
    // Remove any trailing slashes
    cleanAddress = cleanAddress.replace(/\/$/, '');
    
    // Remove port if user included it in the address
    cleanAddress = cleanAddress.replace(/:\d+$/, '');

    // Build the URL
    const protocol = useHttps ? 'https' : 'http';
    return `${protocol}://${cleanAddress}:${port}`;
  };

  const handleConnect = async () => {
    // Validation
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

      // Test connection
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

      // Connection successful
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📚</Text>
        </View>

        {/* Title */}
        <Text variant="headlineMedium" style={styles.title}>
          Connect to Kavita
        </Text>
        
        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter your server details to access your library
        </Text>

        {/* Connection Type Selector */}
        <SegmentedButtons
          value={connectionType}
          onValueChange={setConnectionType}
          buttons={[
            {
              value: 'ip',
              label: 'IP Address',
              icon: 'ip-network',
            },
            {
              value: 'opds',
              label: 'OPDS URL',
              icon: 'link',
            },
          ]}
          style={styles.segmentedButtons}
        />

        {/* IP Address Mode */}
        {connectionType === 'ip' && (
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" style={styles.label}>
              Server Address
            </Text>
            
            <TextInput
              value={serverAddress}
              onChangeText={setServerAddress}
              placeholder="192.168.1.100 or myserver.com"
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              left={<TextInput.Icon icon="server" />}
              disabled={loading}
            />

            <View style={styles.portContainer}>
              <Text variant="labelLarge" style={styles.label}>
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
                  style={styles.portButton}
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
                  style={styles.portInputCenter}
                  disabled={loading}
                />
                <Button
                  mode="outlined"
                  onPress={() => {
                    const currentPort = parseInt(port) || 5000;
                    if (currentPort < 65535) setPort(String(currentPort + 1));
                  }}
                  disabled={loading}
                  style={styles.portButton}
                  compact
                >
                  +
                </Button>
              </View>
            </View>

            <View style={styles.httpsContainer}>
              <Text variant="labelLarge" style={styles.label}>
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
            
            <Text variant="bodySmall" style={styles.hint}>
              Default Kavita port is 5000. Protocol is usually HTTP for local networks.
            </Text>

            <View style={styles.previewContainer}>
              <Text variant="bodySmall" style={styles.previewLabel}>
                Will connect to:
              </Text>
              <Text variant="bodyMedium" style={styles.previewUrl}>
                {serverAddress ? buildServerUrl() : 'Enter server address above'}
              </Text>
            </View>
          </View>
        )}

        {/* OPDS Mode */}
        {connectionType === 'opds' && (
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" style={styles.label}>
              OPDS Feed URL
            </Text>
            
            <TextInput
              value={opdsUrl}
              onChangeText={setOpdsUrl}
              placeholder="https://example.com/api/opds/..."
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              left={<TextInput.Icon icon="rss" />}
              disabled={loading}
            />
            
            <Text variant="bodySmall" style={styles.hint}>
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
          contentStyle={styles.buttonContent}
        >
          {loading ? 'Connecting...' : 'Connect Server'}
        </Button>

        {loading && <ActivityIndicator style={styles.loader} />}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text variant="labelMedium" style={styles.dividerText}>
            DEMO MODE
          </Text>
          <Divider style={styles.divider} />
        </View>

        {/* Demo Mode Button */}
        <Button
          mode="outlined"
          onPress={handleDemoMode}
          style={styles.demoButton}
          contentStyle={styles.buttonContent}
        >
          Try Demo Library
        </Button>
              </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    padding: 16,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 40,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#666',
    fontSize: 13,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    color: '#333',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  portContainer: {
    marginBottom: 10,
  },
  portSpinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  portButton: {
    minWidth: 44,
    borderColor: '#1976D2',
  },
  portInputCenter: {
    flex: 1,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  httpsContainer: {
    marginBottom: 4,
  },
  protocolButtons: {
    backgroundColor: '#fff',
  },
  hint: {
    color: '#999',
    fontSize: 10,
    marginBottom: 8,
  },
  previewContainer: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  previewLabel: {
    color: '#1976D2',
    marginBottom: 2,
    fontSize: 10,
  },
  previewUrl: {
    color: '#1565C0',
    fontWeight: '500',
    fontSize: 12,
  },
  connectButton: {
    marginBottom: 10,
    backgroundColor: '#FF6B35',
  },
  buttonContent: {
    paddingVertical: 4,
  },
  loader: {
    marginVertical: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontWeight: '500',
    fontSize: 10,
  },
  demoButton: {
    marginBottom: 10,
    borderColor: '#999',
  },
});