import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { PlantCard } from '../components/PlantCard';
import { usePlants } from '../context/PlantContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { MainTabsParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'MyPlants'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function MyPlantsScreen({ navigation }: Props) {
  const { plants } = usePlants();

  if (plants.length === 0) {
    return (
      <EmptyState
        emoji="🪴"
        title="Aún no agregaste plantas"
        description="Tomá tu primera foto para empezar a cuidar mejor."
        cta={{ label: 'Tomar foto', onPress: () => navigation.navigate('Capture') }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={plants}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListFooterComponent={
          <Button
            title="📷 Agregar planta"
            onPress={() => navigation.navigate('Capture')}
            style={{ marginTop: spacing.lg }}
          />
        }
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            onPress={() => navigation.navigate('PlantDetail', { plantId: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.xl, paddingBottom: spacing.xxl },
});
