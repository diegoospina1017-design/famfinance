import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { identifyPlant } from '../api/plants';
import { uploadPlantPhoto } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

export function CaptureScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  }

  async function handleAnalyze() {
    if (!imageUri) return;
    try {
      setAnalyzing(true);
      const photoUrl = await uploadPlantPhoto(imageUri, user?.id ?? 'anon');
      const { analysis } = await identifyPlant(photoUrl);
      navigation.replace('Identification', { photoUrl, analysis });
    } catch (e: any) {
      Alert.alert('No pudimos analizar', e?.message ?? 'Intentá de nuevo');
    } finally {
      setAnalyzing(false);
    }
  }

  if (analyzing) return <Loader label="Analizando tu planta..." />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.previewWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={[styles.preview, styles.placeholder]}>
              <Text style={{ fontSize: 64 }}>🌿</Text>
              <Text style={[typography.bodyMuted, { marginTop: spacing.sm, textAlign: 'center' }]}>
                Encuadrá la planta con buena luz para mejorar la identificación.
              </Text>
            </View>
          )}
        </View>

        <Card>
          <Text style={typography.h3}>Tips para mejor diagnóstico</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            • Mostrá toda la hoja{'\n'}
            • Usá luz natural{'\n'}
            • Acercá problemas como manchas o plagas
          </Text>
        </Card>

        <View style={{ gap: spacing.sm }}>
          <Button title="📷 Tomar foto" onPress={pickFromCamera} fullWidth />
          <Button title="🖼  Subir desde galería" variant="secondary" onPress={pickFromLibrary} fullWidth />
          {imageUri && (
            <Button title="🔍 Analizar esta foto" onPress={handleAnalyze} fullWidth />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.xl },
  previewWrap: { alignItems: 'center' },
  preview: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  placeholder: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
