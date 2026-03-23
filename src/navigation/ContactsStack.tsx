import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../theme';
import { ContactsScreen } from '../screens/ContactsScreen';
import { ContactDetailScreen } from '../screens/ContactDetailScreen';

const Stack = createStackNavigator();

export function ContactsStack() {
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
        name="ContactsList"
        component={ContactsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={({ route }: any) => ({ title: route.params?.contact?.name ?? 'Docent' })}
      />
    </Stack.Navigator>
  );
}
