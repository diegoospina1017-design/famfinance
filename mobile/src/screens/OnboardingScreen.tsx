import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '📸',
    title: 'Tomá una foto',
    description: 'Identificamos tu planta al instante con inteligencia artificial.',
  },
  {
    emoji: '🩺',
    title: 'Diagnóstico claro',
    description: 'Detectamos hojas amarillas, plagas, riego excesivo y más, en lenguaje simple.',
  },
  {
    emoji: '⏰',
    title: 'Cuidado en piloto automático',
    description: 'Te avisamos cuándo regar, fertilizar y revisar plagas.',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { setHasOnboarded } = useAuth();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1 });
    } else {
      setHasOnboarded(true);
      navigation.navigate('Login');
    }
  };

  const onViewable = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={ref}
        horizontal
        pagingEnabled
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={{ fontSize: 96 }}>{item.emoji}</Text>
            <Text style={[typography.display, { textAlign: 'center', marginTop: spacing.lg }]}>
              {item.title}
            </Text>
            <Text style={[typography.bodyMuted, { textAlign: 'center', marginTop: spacing.md }]}>
              {item.description}
            </Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i === index ? colors.primary : colors.border }]}
          />
        ))}
      </View>
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm }}>
        <Button title={index === SLIDES.length - 1 ? 'Empezar' : 'Siguiente'} onPress={handleNext} fullWidth />
        <Button
          title="Ya tengo cuenta"
          variant="ghost"
          onPress={() => {
            setHasOnboarded(true);
            navigation.navigate('Login');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slide: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
