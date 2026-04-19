import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen from '@/screens/DashboardScreen';
import TransactionsScreen from '@/screens/TransactionsScreen';
import BudgetsScreen from '@/screens/BudgetsScreen';
import SharedBalanceScreen from '@/screens/SharedBalanceScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { theme } from '@/lib/theme';

const Tab = createBottomTabNavigator();

function icon(label: string, focused: boolean) {
  return (
    <Text style={{ fontSize: 18, color: focused ? theme.colors.primary : theme.colors.textMuted }}>
      {label}
    </Text>
  );
}

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => icon('📊', focused), title: 'Resumen' }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ tabBarIcon: ({ focused }) => icon('💸', focused), title: 'Movimientos' }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{ tabBarIcon: ({ focused }) => icon('🎯', focused), title: 'Presupuestos' }}
      />
      <Tab.Screen
        name="Shared"
        component={SharedBalanceScreen}
        options={{ tabBarIcon: ({ focused }) => icon('🤝', focused), title: 'Compartido' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => icon('⚙️', focused), title: 'Ajustes' }}
      />
    </Tab.Navigator>
  );
}
