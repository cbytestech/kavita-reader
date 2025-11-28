import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { KavitaClient } from '../api/kavitaClient';
import { useServerStore } from '../stores/serverStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const { serverUrl } = route.params;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const addServer = useServerStore((state) => state.addServer);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    
    try {
      const client = new KavitaClient(serverUrl);
      const user = await client.login(username, password);
      
      const serverId = Date.now().toString();
      addServer({
        name: serverUrl.replace(/^https?:\/\//, ''),
        url: serverUrl,
        type: 'kavita',
        isDefault: true,
      });

      Alert.alert('Success', 'Logged in successfully!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔐</Text>
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          Sign In
        </Text>
        
        <Text variant="bodyMedium" style={styles.subtitle}>
          {serverUrl.replace(/^https?:\/\//, '')}
        </Text>

        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          left={<TextInput.Icon icon="account" />}
          disabled={loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!showPassword}
          style={styles.input}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon 
              icon={showPassword ? "eye-off" : "eye"} 
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>

        {loading && <ActivityIndicator style={styles.loader} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#1976D2',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loader: {
    marginTop: 16,
  },
});