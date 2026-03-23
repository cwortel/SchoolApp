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
import { useGradesStore } from '../store/gradesStore';
import { useGrades } from '../hooks/useGrades';
import { Skeleton, ErrorRetry } from '../components';
import { Colors, Spacing, Radius } from '../theme';
import { Grade } from '../types';
import { formatGrade, gradeColor } from '../scrapers/scrapeUtils';

export function GradesScreen() {
  const insets = useSafeAreaInsets();
  const { examGrades, loading, error } = useGradesStore();
  const { refresh } = useGrades();

  // Sort: newest year+period first
  const sorted = useMemo(() => {
    return [...examGrades].sort((a, b) => {
      const yearDiff = (b.year ?? 0) - (a.year ?? 0);
      if (yearDiff !== 0) return yearDiff;
      return (b.period ?? '').localeCompare(a.period ?? '');
    });
  }, [examGrades]);

  if (error) return <ErrorRetry message={error} onRetry={refresh} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Cijfers</Text>
      </View>

      {/* column headers */}
      <View style={styles.colHeader}>
        <Text style={[styles.colText, styles.colPeriod]}>Jaar / Per.</Text>
        <Text style={[styles.colText, { flex: 1 }]}>Module · Opdracht</Text>
        <Text style={[styles.colText, styles.colGrade]}>Cijfer</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: Spacing.base }}>
              {[1, 2, 3, 4, 5].map((k) => (
                <View key={k} style={styles.skeletonRow}>
                  <Skeleton width={44} height={14} style={{ marginRight: Spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width="45%" height={11} />
                  </View>
                  <Skeleton width={36} height={28} borderRadius={Radius.sm} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="school-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nog geen cijfers beschikbaar</Text>
            </View>
          )
        }
        renderItem={({ item }) => <GradeRow grade={item} />}
      />
    </View>
  );
}

function GradeRow({ grade }: { grade: Grade }) {
  const hasNumeric = grade.value > 0;
  const color = hasNumeric
    ? gradeColor(grade.value)
    : grade.status === 'passed' ? 'green' : grade.status === 'failed' ? 'red' : 'orange';

  const colorMap = { green: Colors.gradeGreen, orange: Colors.gradeOrange, red: Colors.gradeRed };
  const bgMap    = { green: Colors.gradeGreenBg, orange: Colors.gradeOrangeBg, red: Colors.gradeRedBg };

  const gradeLabel = hasNumeric
    ? formatGrade(grade.value)
    : grade.status === 'passed' ? 'V' : grade.status === 'failed' ? 'NV' : '–';

  // "Jaar 1 - Periode 2" → "J1 P2"
  const periodTag = grade.date
    .replace(/Jaar\s*/i, 'J').replace(/\s*-\s*Periode\s*/i, ' P') || '–';

  return (
    <View style={styles.row}>
      <View style={styles.periodTag}>
        <Text style={styles.periodText}>{periodTag}</Text>
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.module} numberOfLines={1}>{grade.subject}</Text>
        {grade.description ? (
          <Text style={styles.opdracht} numberOfLines={1}>{grade.description}</Text>
        ) : grade.examType ? (
          <Text style={styles.opdracht} numberOfLines={1}>{grade.examType}</Text>
        ) : null}
      </View>

      <View style={[styles.gradeBadge, { backgroundColor: bgMap[color] }]}>
        <Text style={[styles.gradeValue, { color: colorMap[color] }]}>{gradeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },

  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  colPeriod: { width: 64, marginRight: Spacing.sm },
  colGrade: { width: 52, textAlign: 'center' },

  list: { backgroundColor: Colors.surface },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.base + 64 + Spacing.sm },

  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    marginBottom: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
  },
  periodTag: {
    width: 64,
    marginRight: Spacing.sm,
  },
  periodText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  rowBody: { flex: 1, marginRight: Spacing.sm },
  module: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  opdracht: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  gradeBadge: {
    width: 52,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeValue: { fontSize: 16, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 64, gap: Spacing.base, backgroundColor: Colors.surface, flex: 1 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
});

