import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { isValidEmail } from '../utils/validators';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!isValidEmail(email)) return setError('Email inválido');
    if (!password) return setError('Ingresá tu contraseña');
    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? 'Error con Google login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 64, textAlign: 'center' }}>🌿</Text>
          <Text style={[typography.display, { textAlign: 'center', marginTop: spacing.md }]}>
            Bienvenida
          </Text>
          <Text style={[typography.bodyMuted, { textAlign: 'center', marginBottom: spacing.xl }]}>
            Iniciá sesión para empezar a cuidar tus plantas.
          </Text>

          <View style={{ gap: spacing.md }}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="tu@email.com"
            />
            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            {error && <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}
          </View>

          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Button title="Entrar" onPress={handleLogin} loading={loading} fullWidth />
            <Button title="Continuar con Google" variant="secondary" onPress={handleGoogle} fullWidth />
          </View>

          <View style={{ marginTop: spacing.xxl, alignItems: 'center' }}>
            <Text style={typography.bodyMuted}>¿No tenés cuenta?</Text>
            <Button title="Crear cuenta" variant="ghost" onPress={() => navigation.navigate('Signup')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl },
});
