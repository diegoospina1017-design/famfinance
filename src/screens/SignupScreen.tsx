import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { useAuthStore } from '@/stores/useAuthStore';
import { theme } from '@/lib/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const signUp = useAuthStore((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password || !name) return;
    setBusy(true);
    try {
      await signUp(email.trim(), password, name.trim());
      Alert.alert('¡Listo!', 'Revisa tu correo para confirmar la cuenta.');
      navigation.replace('Login');
    } catch (e: any) {
      Alert.alert('No pudimos crear la cuenta', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Crear cuenta</Text>

      <TextInput
        placeholder="Tu nombre"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
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
        placeholder="contraseña (mínimo 6)"
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} disabled={busy}>
        <Text style={styles.primaryBtnText}>{busy ? 'Creando...' : 'Crear cuenta'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Volver</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', marginBottom: 20 },
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
