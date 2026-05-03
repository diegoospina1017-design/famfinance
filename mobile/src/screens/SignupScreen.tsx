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
import { isValidEmail, passwordIssue } from '../utils/validators';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async () => {
    setError(null);
    if (name.trim().length < 2) return setError('Tu nombre es muy corto');
    if (!isValidEmail(email)) return setError('Email inválido');
    const pwIssue = passwordIssue(password);
    if (pwIssue) return setError(pwIssue);
    try {
      setLoading(true);
      await signUp(email.trim(), password, name.trim());
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos crear la cuenta');
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
          <Text style={[typography.display, { marginBottom: spacing.sm }]}>Crear cuenta</Text>
          <Text style={[typography.bodyMuted, { marginBottom: spacing.xl }]}>
            Empezá a cuidar tus plantas con un asistente experto.
          </Text>

          <View style={{ gap: spacing.md }}>
            <TextInput label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
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
              placeholder="Mínimo 8 caracteres"
            />
            {error && <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}
          </View>

          <Button title="Crear cuenta" onPress={handle} loading={loading} fullWidth style={{ marginTop: spacing.xl }} />
          <Button title="Ya tengo cuenta" variant="ghost" onPress={() => navigation.navigate('Login')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl },
});
