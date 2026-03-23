import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';

interface DateStripProps {
  /** Sorted array of date strings in "dd-MM-yyyy" format */
  dates: string[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

/** Convert "dd-MM-yyyy" to a short label: "ma 23 mrt" */
function formatDateLabel(raw: string): string {
  const parts = raw.split('-');
  if (parts.length !== 3) return raw;
  const [dd, mm, yyyy] = parts;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const dayNames = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return `${dayNames[d.getDay()]} ${dd} ${monthNames[d.getMonth()]}`;
}

export function DateStrip({ dates, selectedDate, onSelect }: DateStripProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to selected date
    if (!selectedDate) return;
    const idx = dates.indexOf(selectedDate);
    if (idx >= 0) {
      scrollRef.current?.scrollTo({ x: idx * 100, animated: true });
    }
  }, [selectedDate]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dates.map((date) => {
        const active = date === selectedDate;
        return (
          <TouchableOpacity
            key={date}
            onPress={() => onSelect(date)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {formatDateLabel(date)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.white,
    fontWeight: '600',
  },
});
