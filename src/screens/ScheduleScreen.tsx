import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useScheduleStore } from '../store/scheduleStore';
import { useSchedule } from '../hooks/useSchedule';
import { LessonSkeleton, ErrorRetry } from '../components';
import { Colors, Spacing, Radius } from '../theme';
import { Lesson } from '../types';

// ─── date helpers ────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  if (!s || !s.includes('-')) return new Date(NaN);
  const [dd, mm, yyyy] = s.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function isValidDate(d: Date): boolean {
  return !isNaN(d.getTime());
}

function formatDateStr(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function todayStr(): string {
  return formatDateStr(new Date());
}

const DAY_ABBRS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const DUTCH_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

// Time windows per dagdeel. Weekend times are 30 min later.
const DAGDEEL_TIMES: Record<string, { weekday: string; weekend: string }> = {
  Ochtend: { weekday: '09:00 – 12:00', weekend: '09:30 – 12:30' },
  Middag:  { weekday: '13:00 – 16:00', weekend: '13:30 – 16:30' },
  Avond:   { weekday: '19:00 – 22:00', weekend: '19:00 – 22:00' },
};

function dagdeelTime(dagdeel: string, isWeekend: boolean): string {
  const entry = DAGDEEL_TIMES[dagdeel];
  if (!entry) return dagdeel;
  return `${dagdeel}  ${isWeekend ? entry.weekend : entry.weekday}`;
}

// ─── screen ──────────────────────────────────────────────────────────────────

export function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { lessons, loading, error } = useScheduleStore();
  const { refresh } = useSchedule();

  const today = useMemo(() => todayStr(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [weekOffset, setWeekOffset] = useState(0);
  // Prevents the auto-jump-to-first-lesson from firing again after a pull-to-refresh
  const didAutoJump = useRef(false);

  // Move one week forward or backward, keeping the same day-of-week selected.
  function moveWeek(delta: number) {
    const newOffset = weekOffset + delta;
    setWeekOffset(newOffset);
    const cur = isValidDate(parseDate(selectedDate)) ? parseDate(selectedDate) : new Date();
    const dow = cur.getDay(); // 0=Sun..6=Sat
    const idx = dow === 0 ? 6 : dow - 1; // Mon=0..Sun=6
    const newMonday = addDays(getMondayOf(parseDate(today)), newOffset * 7);
    setSelectedDate(formatDateStr(addDays(newMonday, idx)));
  }

  const weekMonday = useMemo(
    () => addDays(getMondayOf(parseDate(today)), weekOffset * 7),
    [today, weekOffset],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i)),
    [weekMonday],
  );

  const lessonDateSet = useMemo(
    () => new Set(lessons.map((l) => l.date)),
    [lessons],
  );

  // On initial data load only: if the selected date has no lessons, jump to the
  // first lesson date. Guarded by didAutoJump so pull-to-refresh can't reset position.
  useEffect(() => {
    if (lessons.length === 0) return;
    if (didAutoJump.current) return;
    didAutoJump.current = true;
    if (lessonDateSet.has(selectedDate)) return;
    const sorted = [...lessons]
      .filter((l) => l.date && isValidDate(parseDate(l.date)))
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    if (sorted.length === 0) return;
    const firstDate = parseDate(sorted[0].date);
    const todayDate = parseDate(today);
    const diffWeeks = Math.round(
      (getMondayOf(firstDate).getTime() - getMondayOf(todayDate).getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
    setSelectedDate(sorted[0].date);
    setWeekOffset(diffWeeks);
  }, [lessons]);

  const dayLessons = useMemo(
    () =>
      lessons
        .filter((l) => l.date === selectedDate)
        .sort((a, b) =>
          a.dagdeel === b.dagdeel ? 0 : a.dagdeel === 'Ochtend' ? -1 : 1,
        ),
    [lessons, selectedDate],
  );

  // Is the selected date a weekend day?
  const selectedIsWeekend = useMemo(() => {
    const d = parseDate(selectedDate);
    if (!isValidDate(d)) return false;
    const dow = d.getDay();
    return dow === 0 || dow === 6;
  }, [selectedDate]);

  const headerLabel = useMemo(() => {
    const d = parseDate(selectedDate);
    if (!isValidDate(d)) return 'Rooster';
    const name = DUTCH_DAYS[d.getDay()] ?? 'dag';
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${d.getDate()} ${DUTCH_MONTHS[d.getMonth()]}.`;
  }, [selectedDate]);

  if (error) return <ErrorRetry message={error} onRetry={refresh} />;

  return (
    <View style={styles.outer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── blue header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>{headerLabel}</Text>

        {/* week strip */}
        <View style={styles.weekStrip}>
          <TouchableOpacity
            onPress={() => moveWeek(-1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>

          {weekDays.map((day, i) => {
            const ds = formatDateStr(day);
            const isSelected = ds === selectedDate;
            const hasLessons = lessonDateSet.has(ds);
            return (
              <TouchableOpacity
                key={ds}
                onPress={() => setSelectedDate(ds)}
                style={styles.dayCol}
              >
                <Text style={[styles.dayAbbr, isSelected && styles.dayAbbrSelected]}>
                  {DAY_ABBRS[i]}
                </Text>
                <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                  <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                    {day.getDate()}
                  </Text>
                </View>
                <View style={[styles.dot, hasLessons && styles.dotVisible]} />
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => moveWeek(1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── lesson list – always a FlatList so header never jumps ── */}
      <FlatList
        data={dayLessons}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={[styles.list, dayLessons.length === 0 && styles.listGrow]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletons}>
              {[1, 2, 3, 4].map((k) => <LessonSkeleton key={k} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Geen lessen op deze dag</Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => <LessonRow lesson={item} index={index} isWeekend={selectedIsWeekend} />}
        ListFooterComponent={<TimeReferenceFooter isWeekend={selectedIsWeekend} />}
      />
    </View>
  );
}

// ─── time reference footer ───────────────────────────────────────────────────

function TimeReferenceFooter({ isWeekend }: { isWeekend: boolean }) {
  return (
    <View style={styles.timeRef}>
      {Object.entries(DAGDEEL_TIMES).map(([label, times]) => (
        <View key={label} style={styles.timeRefRow}>
          <Text style={styles.timeRefLabel}>{label}</Text>
          <Text style={styles.timeRefTime}>{isWeekend ? times.weekend : times.weekday}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── lesson row ──────────────────────────────────────────────────────────────

function LessonRow({ lesson, index, isWeekend }: { lesson: Lesson; index: number; isWeekend: boolean }) {
  const isUnscheduled = lesson.status === 'unscheduled';

  return (
    <View style={styles.row}>
      {/* lesson number */}
      <Text style={styles.rowNum}>{index + 1}</Text>

      {/* main content */}
      <View style={styles.rowBody}>
        <Text style={styles.rowModule} numberOfLines={1}>
          {lesson.module || '—'}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[lesson.dagdeel, lesson.lesinhoud, !isUnscheduled && lesson.room]
            .filter(Boolean)
            .join('  ·  ')}
        </Text>
      </View>

      {/* badge */}
      {lesson.teacher ? (
        <View style={[styles.badge, isUnscheduled ? styles.badgeWarn : styles.badgeBlue]}>
          <Text style={[styles.badgeText, isUnscheduled ? styles.badgeTextWarn : styles.badgeTextBlue]}>
            {isUnscheduled ? 'In te roosteren' : lesson.teacher}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.background },

  // header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },

  // week strip
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCol: { alignItems: 'center', flex: 1 },
  dayAbbr: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: 4 },
  dayAbbrSelected: { color: '#fff', fontWeight: '700' },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: '#fff' },
  dayNum: { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  dayNumSelected: { color: Colors.primary, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4, backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: 'rgba(255,255,255,0.55)' },

  // list
  skeletons: { padding: Spacing.base },
  list: { paddingBottom: Spacing.xl, backgroundColor: Colors.surface },
  listGrow: { flexGrow: 1 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 52 },
  empty: { alignItems: 'center', paddingTop: 64, gap: Spacing.base, backgroundColor: Colors.surface, flex: 1 },
  emptyText: { fontSize: 15, color: Colors.textMuted },

  // time reference footer
  timeRef: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: 6,
  },
  timeRefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  timeRefLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    width: 70,
  },
  timeRefTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },

  // row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
  },
  rowNum: {
    width: 28,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    marginRight: Spacing.sm,
  },
  rowBody: { flex: 1, marginRight: Spacing.sm },
  rowModule: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  rowMeta: { fontSize: 13, color: Colors.textSecondary },

  // badges
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeBlue: { backgroundColor: Colors.primaryLight },
  badgeTextBlue: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  badgeWarn: { backgroundColor: Colors.statusChangedBg },
  badgeTextWarn: { fontSize: 11, fontWeight: '600', color: Colors.statusChanged },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
