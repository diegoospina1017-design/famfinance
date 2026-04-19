import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '@/stores/useAuthStore';
import { theme } from '@/lib/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return;
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      Alert.alert('No pudimos iniciar sesión', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>famfinance</Text>
      <Text style={styles.subtitle}>Tus finanzas en pareja, en un solo lugar</Text>

      <TextInput
        placeholder="correo@ejemplo.com"
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="contraseña"
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} disabled={busy}>
        <Text style={styles.primaryBtnText}>{busy ? 'Entrando...' : 'Iniciar sesión'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Crear cuenta nueva</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: 'center' },
  title: { color: theme.colors.primary, fontSize: 36, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: theme.colors.textMuted, marginBottom: 32 },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: 14,
    borderRadius: theme.radius,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: theme.colors.bg, fontWeight: '700', fontSize: 16 },
  link: { color: theme.colors.primary, textAlign: 'center', marginTop: 20 },
});
