import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubjectAverage, Grade } from '../types';
import { Card, Badge } from '../components';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { formatGrade, gradeColor } from '../scrapers/scrapeUtils';

interface GradeDetailScreenProps {
  route: { params: { subject: SubjectAverage } };
}

export function GradeDetailScreen({ route }: GradeDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { subject } = route.params;

  const color = gradeColor(subject.average);
  const colorMap = { green: Colors.gradeGreen, orange: Colors.gradeOrange, red: Colors.gradeRed };
  const bgMap  = { green: Colors.gradeGreenBg, orange: Colors.gradeOrangeBg, red: Colors.gradeRedBg };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Summary banner */}
      <View style={[styles.banner, { backgroundColor: bgMap[color] }]}>
        <View>
          <Text style={styles.bannerSubject}>{subject.subject}</Text>
          <Text style={styles.bannerCount}>{subject.grades.length} resultaten</Text>
        </View>
        <Text style={[styles.bannerGrade, { color: colorMap[color] }]}>
          {formatGrade(subject.average)}
        </Text>
      </View>

      <FlatList
        data={[...subject.grades].sort((a, b) => b.date.localeCompare(a.date))}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <GradeRow grade={item} />}
      />
    </View>
  );
}

function GradeRow({ grade }: { grade: Grade }) {
  const numericColor = grade.value > 0 ? gradeColor(grade.value) : 'orange';
  const statusColor = grade.status === 'passed' ? 'green'
    : grade.status === 'failed' ? 'red' : 'orange';
  const badgeVariant: 'green' | 'orange' | 'red' =
    grade.value > 0 ? numericColor : statusColor;

  const badgeLabel = grade.value > 0
    ? formatGrade(grade.value)
    : grade.status === 'passed' ? 'V'
    : grade.status === 'failed' ? 'NV' : '...';

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.desc}>{grade.description || 'Resultaat'}</Text>
          {grade.examType ? (
            <Text style={styles.examType}>{grade.examType}</Text>
          ) : null}
          <Text style={styles.meta}>
            {grade.date}
            {grade.valueText ? ` · ${grade.valueText}` : ''}
          </Text>
        </View>
        <Badge label={badgeLabel} variant={badgeVariant} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  bannerSubject: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  bannerCount: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  bannerGrade: { fontSize: 40, fontWeight: '800' },
  list: { padding: Spacing.base, paddingTop: Spacing.sm },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  desc: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  examType: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
