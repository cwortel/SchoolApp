import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../theme';

interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
}

export function Avatar({ initials, size = 40, color = Colors.primary }: AvatarProps) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22' },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
});
