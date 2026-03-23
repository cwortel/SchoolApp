import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContactsStore } from '../store/contactsStore';
import { useContacts } from '../hooks/useContacts';
import { Skeleton, ErrorRetry } from '../components';
import { Colors, Spacing, Radius } from '../theme';
import { Contact } from '../types';

const SECTION_COLORS: Record<string, string> = {
  FAM: Colors.primary,
  TFB: '#9333EA',
};

export function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const { contacts, loading, error } = useContactsStore();
  const { refresh } = useContacts();

  // Group by section (role)
  const sections = useMemo(() => {
    const map = new Map<string, Contact[]>();
    contacts.forEach((c) => {
      const key = c.role || 'Overig';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [contacts]);

  // Flatten sections into a single list with section-header items
  const rows = useMemo(() => {
    const items: ({ type: 'header'; title: string } | { type: 'contact'; contact: Contact })[] = [];
    sections.forEach(({ title, data }) => {
      items.push({ type: 'header', title });
      data.forEach((c) => items.push({ type: 'contact', contact: c }));
    });
    return items;
  }, [sections]);

  if (error) return <ErrorRetry message={error} onRetry={refresh} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Docenten</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: Spacing.base }}>
              {[1, 2, 3].map((k) => (
                <View key={k} style={styles.skeletonRow}>
                  <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: Spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Skeleton width="55%" height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width="40%" height={11} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Geen contacten gevonden</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            const color = SECTION_COLORS[item.title] ?? Colors.textSecondary;
            return (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: color }]} />
                <Text style={[styles.sectionTitle, { color }]}>{item.title}</Text>
              </View>
            );
          }
          return <ContactRow contact={item.contact} />;
        }}
      />
    </View>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const initials = (() => {
    const parts = contact.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return contact.name.slice(0, 2).toUpperCase();
  })();

  const sectionColor = SECTION_COLORS[contact.role] ?? Colors.primary;

  return (
    <View style={styles.row}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: sectionColor + '22' }]}>
        <Text style={[styles.avatarText, { color: sectionColor }]}>{initials}</Text>
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.name}>{contact.name}</Text>
        <View style={styles.metaRow}>
          {contact.year ? (
            <Text style={styles.metaText}>{contact.year}</Text>
          ) : null}
          {contact.year && contact.location ? (
            <Text style={styles.metaDot}> · </Text>
          ) : null}
          {contact.location ? (
            <Text style={styles.metaText}>{contact.location}</Text>
          ) : null}
        </View>
      </View>

      {contact.email ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${contact.email}`)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.emailBtn}
        >
          <Ionicons name="mail-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  list: { paddingBottom: Spacing.xl },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  rowBody: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: Colors.textMuted },
  metaDot: { fontSize: 12, color: Colors.textMuted },
  emailBtn: { marginLeft: Spacing.sm },

  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.base,
  },
  empty: { alignItems: 'center', paddingTop: 64, gap: Spacing.base },
  emptyText: { fontSize: 15, color: Colors.textMuted },
});
