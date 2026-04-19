import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '@/stores/useAuthStore';
import LoginScreen from '@/screens/LoginScreen';
import SignupScreen from '@/screens/SignupScreen';
import HouseholdOnboardingScreen from '@/screens/HouseholdOnboardingScreen';
import AddTransactionScreen from '@/screens/AddTransactionScreen';
import TabsNavigator from '@/navigation/TabsNavigator';
import { theme } from '@/lib/theme';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  AddTransaction: { id?: string } | undefined;
  HouseholdOnboarding: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList & AppStackParamList>();

export default function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const needsOnboarding = session && (!profile || !profile.household_id);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      {!session ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Crear cuenta' }} />
        </>
      ) : needsOnboarding ? (
        <Stack.Screen
          name="HouseholdOnboarding"
          component={HouseholdOnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
            options={{ title: 'Nueva transacción', presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
