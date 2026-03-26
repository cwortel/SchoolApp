import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAbsencesStore } from '../store/absencesStore';
import { useAbsences } from '../hooks/useAbsences';
import { Card, Badge, Skeleton, ErrorRetry } from '../components';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { AttendanceRecord } from '../types';

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function formatDate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('-');
  return `${parseInt(day, 10)} ${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

function formatHours(h: number): string {
  const rounded = Math.round(h * 10) / 10;
  return rounded === Math.floor(rounded) ? `${rounded} uur` : `${rounded.toFixed(1)} uur`;
}

function toSortKey(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-');
  return `${y}-${m}-${d}`;
}

type BadgeVariant = 'green' | 'orange' | 'red' | 'gray';

function getAbsenceBadges(record: AttendanceRecord): { label: string; variant: BadgeVariant }[] {
  const result: { label: string; variant: BadgeVariant }[] = [];
  if (record.allDayValid === 0) result.push({ label: 'Ongeoorloofd', variant: 'red' });
  else if (record.allDayValid === 1) result.push({ label: 'Geoorloofd', variant: 'green' });
  if (record.tooLateValid === 0) result.push({ label: 'Te laat', variant: 'orange' });
  else if (record.tooLateValid === 1) result.push({ label: 'Te laat', variant: 'gray' });
  if (record.tooEarlyValid === 0) result.push({ label: 'Te vroeg weg', variant: 'orange' });
  else if (record.tooEarlyValid === 1) result.push({ label: 'Te vroeg weg', variant: 'gray' });
  return result;
}

export function AbsencesScreen() {
  const insets = useSafeAreaInsets();
  const { absences, loading, error } = useAbsencesStore();
  const { refresh } = useAbsences();

  const { filtered, totalMissed } = useMemo(() => {
    const filtered = absences
      .filter((r) => r.hoursMissed > 0 || r.cameTooLate !== null || r.leftTooEarly !== null)
      .sort((a, b) => toSortKey(b.lessonDate).localeCompare(toSortKey(a.lessonDate)));
    const totalMissed = filtered.reduce((sum, r) => sum + r.hoursMissed, 0);
    return { filtered, totalMissed };
  }, [absences]);

  if (error) return <ErrorRetry message={error} onRetry={refresh} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={Typography.h2}>Verzuim</Text>
        {filtered.length > 0 && (
          <View style={styles.summaryBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.gradeOrange} />
            <Text style={styles.summaryText}>
              {formatHours(totalMissed)} gemist dit schooljaar
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.kvmrId}-${item.dagdeelAfk}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: Spacing.base }}>
              {[1, 2, 3].map((k) => (
                <View key={k} style={styles.skeletonCard}>
                  <Skeleton width={90} height={12} style={{ marginBottom: 8 }} />
                  <Skeleton width="60%" height={16} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.gradeGreen} />
              <Text style={styles.emptyText}>Geen verzuim geregistreerd</Text>
            </View>
          )
        }
        renderItem={({ item }) => <AbsenceCard record={item} />}
      />
    </View>
  );
}

function AbsenceCard({ record }: { record: AttendanceRecord }) {
  const dagdeelLabel = record.dagdeelAfk === 'O' ? 'Ochtend' : 'Middag';
  const badges = getAbsenceBadges(record);

  const details: string[] = [];
  if (record.hoursMissed > 0) details.push(`${formatHours(record.hoursMissed)} gemist`);
  if (record.cameTooLate) details.push(`te laat: ${record.cameTooLate}`);
  if (record.leftTooEarly) details.push(`vroeg weg: ${record.leftTooEarly}`);

  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={styles.subject} numberOfLines={1}>{record.moduleName}</Text>
          <Text style={styles.date}>{formatDate(record.lessonDate)} · {dagdeelLabel}</Text>
          {details.length > 0 && (
            <Text style={styles.details}>{details.join(' · ')}</Text>
          )}
        </View>
        <View style={styles.badges}>
          {badges.map((b, i) => (
            <Badge key={i} label={b.label} variant={b.variant} />
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, paddingTop: Spacing.base },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.gradeOrangeBg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  summaryText: { fontSize: 13, color: Colors.gradeOrange, fontWeight: '500' },
  list: { padding: Spacing.base, paddingTop: Spacing.sm },
  card: { marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  date: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  subject: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  details: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  badges: { gap: 4, alignItems: 'flex-end' },
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  empty: { alignItems: 'center', paddingTop: Spacing.xxxl, gap: Spacing.base },
  emptyText: { fontSize: 15, color: Colors.textMuted },
});
