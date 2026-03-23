import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../theme';

type BadgeVariant = 'scheduled' | 'unscheduled' | 'green' | 'orange' | 'red' | 'blue' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  scheduled:   { bg: Colors.statusNormalBg,    color: Colors.statusNormal },
  unscheduled: { bg: Colors.statusCancelledBg, color: Colors.statusCancelled },
  green:       { bg: Colors.gradeGreenBg,      color: Colors.gradeGreen },
  orange:      { bg: Colors.gradeOrangeBg,     color: Colors.gradeOrange },
  red:         { bg: Colors.gradeRedBg,        color: Colors.gradeRed },
  blue:        { bg: Colors.primaryLight,      color: Colors.primary },
  gray:        { bg: '#F1F5F9',               color: Colors.textSecondary },
};

export function Badge({ label, variant = 'gray', style }: BadgeProps) {
  const { bg, color } = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
