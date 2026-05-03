import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { CaptureScreen } from '../screens/CaptureScreen';
import { IdentificationScreen } from '../screens/IdentificationScreen';
import { DiagnosisScreen } from '../screens/DiagnosisScreen';
import { CarePlanScreen } from '../screens/CarePlanScreen';
import { PlantDetailScreen } from '../screens/PlantDetailScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

export function RootNavigator() {
  const { user, loading, hasOnboarded } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            {!hasOnboarded && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="Capture"
              component={CaptureScreen}
              options={{ presentation: 'modal', headerShown: true, title: 'Tomar foto' }}
            />
            <Stack.Screen
              name="Identification"
              component={IdentificationScreen}
              options={{ headerShown: true, title: 'Identificación' }}
            />
            <Stack.Screen
              name="Diagnosis"
              component={DiagnosisScreen}
              options={{ headerShown: true, title: 'Diagnóstico' }}
            />
            <Stack.Screen
              name="CarePlan"
              component={CarePlanScreen}
              options={{ headerShown: true, title: 'Plan de cuidado' }}
            />
            <Stack.Screen
              name="PlantDetail"
              component={PlantDetailScreen}
              options={{ headerShown: true, title: '' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: true, title: 'Asistente IA' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
