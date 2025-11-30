import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { KavitaClient } from '../api/kavitaClient';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
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
  const theme = useThemeStore((state) => state.theme);

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
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          iconColor={theme.text}
        />

        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { backgroundColor: theme.primaryLight + '30' }]}>📚</Text>
        </View>

        <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
          Sign In
        </Text>
        
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {serverUrl.replace(/^https?:\/\//, '')}
        </Text>

        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={[styles.input, { backgroundColor: theme.surface }]}
          autoCapitalize="none"
          autoCorrect={false}
          left={<TextInput.Icon icon="account" />}
          disabled={loading}
          textColor={theme.text}
          placeholderTextColor={theme.textTertiary}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!showPassword}
          style={[styles.input, { backgroundColor: theme.surface }]}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon 
              icon={showPassword ? "eye-off" : "eye"} 
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          disabled={loading}
          textColor={theme.text}
          placeholderTextColor={theme.textTertiary}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={theme.accent}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>

        {loading && <ActivityIndicator style={styles.loader} color={theme.primary} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loader: {
    marginTop: 16,
  },
});