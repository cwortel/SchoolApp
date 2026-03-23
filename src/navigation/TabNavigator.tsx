import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { GradesStack } from './GradesStack';
import { ContactsStack } from './ContactsStack';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { AbsencesScreen } from '../screens/AbsencesScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, { active: any; inactive: any }> = {
            Schedule:  { active: 'calendar',       inactive: 'calendar-outline' },
            Grades:    { active: 'school',          inactive: 'school-outline' },
            Absences:  { active: 'alert-circle',    inactive: 'alert-circle-outline' },
            Contacts:  { active: 'people',          inactive: 'people-outline' },
          };
          const icon = icons[route.name]?.[focused ? 'active' : 'inactive'] ?? 'ellipse';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Schedule"  component={ScheduleScreen}  options={{ tabBarLabel: 'Rooster' }} />
      <Tab.Screen name="Grades"    component={GradesStack}     options={{ tabBarLabel: 'Cijfers' }} />
      <Tab.Screen name="Absences"  component={AbsencesScreen}  options={{ tabBarLabel: 'Verzuim' }} />
      <Tab.Screen name="Contacts"  component={ContactsStack}   options={{ tabBarLabel: 'Docenten' }} />
    </Tab.Navigator>
  );
}
