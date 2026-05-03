import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { TextInput } from '../components/TextInput';
import { askPlantQuestion, type ChatMessageDTO } from '../api/plants';
import { usePlants } from '../context/PlantContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const SUGGESTED_QUESTIONS = [
  '¿Por qué tiene hojas amarillas?',
  '¿Cuándo debo regarla?',
  '¿Necesita más luz?',
  '¿Cómo la trasplanto?',
];

export function ChatScreen({ route }: Props) {
  const { plantId } = route.params;
  const { plants, diagnoses } = usePlants();
  const plant = plants.find(p => p.id === plantId);
  const lastDiagnosis = diagnoses
    .filter(d => d.plantId === plantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const plantContext = useMemo(() => {
    if (!plant) return null;
    return {
      commonName: plant.commonName,
      scientificName: plant.scientificName,
      description: plant.description,
      lastHealth: plant.lastHealth,
      wateringFrequencyDays: plant.wateringFrequencyDays,
      light: plant.light,
      temperatureMinC: plant.temperatureMinC,
      temperatureMaxC: plant.temperatureMaxC,
      humidityPreference: plant.humidityPreference,
      substrate: plant.substrate,
      fertilizer: plant.fertilizer,
      recentDiagnosisSummary: lastDiagnosis?.summary ?? null,
    };
  }, [plant, lastDiagnosis]);

  if (!plant || !plantContext) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[typography.body, { padding: spacing.xl }]}>Planta no encontrada.</Text>
      </SafeAreaView>
    );
  }

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading || !plantContext) return;
    const newMessages: ChatMessageDTO[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ];
    setMessages(newMessages);
    setDraft('');
    setLoading(true);
    try {
      const { answer } = await askPlantQuestion({
        plant: plantContext,
        history: messages,
        question: trimmed,
      });
      setMessages([...newMessages, { role: 'assistant', content: answer }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e: any) {
      Alert.alert('No pudimos responder', e?.message ?? 'Probá de nuevo en un momento');
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <Text style={typography.h3}>Chat sobre {plant.nickname ?? plant.commonName}</Text>
            <Text style={[typography.bodyMuted, { marginTop: 4 }]}>
              Preguntale a la IA cualquier duda sobre el cuidado de esta planta.
            </Text>
          </Card>

          {messages.length === 0 && (
            <View style={{ gap: spacing.sm }}>
              <Text style={typography.caption}>Sugerencias</Text>
              {SUGGESTED_QUESTIONS.map(q => (
                <Pressable
                  key={q}
                  onPress={() => send(q)}
                  style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}
                >
                  <Text style={typography.body}>{q}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
              ]}
            >
              <Text
                style={[
                  typography.body,
                  m.role === 'user' && { color: '#fff' },
                ]}
              >
                {m.content}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.bubble, styles.bubbleAssistant]}>
              <Text style={typography.bodyMuted}>Pensando...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribí tu pregunta..."
            multiline
            style={{ flex: 1, maxHeight: 100 }}
            onSubmitEditing={() => send(draft)}
          />
          <Pressable
            onPress={() => send(draft)}
            disabled={loading || !draft.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              (loading || !draft.trim()) && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xl },
  suggestion: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.lg,
    maxWidth: '85%',
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.surfaceMuted,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
