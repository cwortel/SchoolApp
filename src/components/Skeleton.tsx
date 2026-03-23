import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = Radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bone,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

/** Renders a lesson-card-shaped skeleton for the schedule loading state. */
export function LessonSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={80} height={12} style={{ marginBottom: Spacing.sm }} />
      <Skeleton width="60%" height={18} style={{ marginBottom: Spacing.sm }} />
      <Skeleton width="40%" height={13} />
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: Colors.skeletonBase,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
});
