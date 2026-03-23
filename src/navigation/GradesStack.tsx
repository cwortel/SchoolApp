import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../theme';
import { GradesScreen } from '../screens/GradesScreen';
import { GradeDetailScreen } from '../screens/GradeDetailScreen';

const Stack = createStackNavigator();

export function GradesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="GradesList"
        component={GradesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GradeDetail"
        component={GradeDetailScreen}
        options={({ route }: any) => ({ title: route.params?.subject?.subject ?? 'Cijfers' })}
      />
    </Stack.Navigator>
  );
}
