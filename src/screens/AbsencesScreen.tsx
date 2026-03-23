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
import { Absence } from '../types';

export function AbsencesScreen() {
  const insets = useSafeAreaInsets();
  const { absences, loading, error } = useAbsencesStore();
  const { refresh } = useAbsences();

  const sorted = useMemo(
    () => [...absences].sort((a, b) => b.date.localeCompare(a.date)),
    [absences]
  );

  if (error) return <ErrorRetry message={error} onRetry={refresh} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={Typography.h2}>Verzuim</Text>
        {absences.length > 0 && (
          <View style={styles.summaryBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.gradeOrange} />
            <Text style={styles.summaryText}>
              {absences.length} absentie{absences.length !== 1 ? 's' : ''} dit schooljaar
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(_, i) => String(i)}
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
        renderItem={({ item }) => <AbsenceCard absence={item} />}
      />
    </View>
  );
}

function AbsenceCard({ absence }: { absence: Absence }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{absence.date}</Text>
          <Text style={styles.subject}>{absence.subject}</Text>
        </View>
        <View style={styles.badges}>
          <Badge label={absence.type} variant="orange" />
          {absence.status ? <Badge label={absence.status} variant="gray" /> : null}
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
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  subject: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
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
