import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Contact } from '../types';
import { Avatar, Card } from '../components';
import { Colors, Spacing, Typography, Radius } from '../theme';

interface ContactDetailScreenProps {
  route: { params: { contact: Contact; color: string } };
}

export function ContactDetailScreen({ route }: ContactDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { contact, color } = route.params;

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function handleEmail() {
    if (!contact.email) return;
    Linking.openURL(`mailto:${contact.email}`).catch(() =>
      Alert.alert('Fout', 'Kan e-mailapp niet openen.')
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.hero, { backgroundColor: color + '22' }]}>
        <Avatar initials={initials(contact.name)} size={80} color={color} />
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.role}>{contact.role}</Text>
        {contact.year ? <Text style={styles.subject}>{contact.year}{contact.location ? ` · ${contact.location}` : ''}</Text> : null}
      </View>

      <View style={styles.section}>
        {contact.email ? (
          <TouchableOpacity onPress={handleEmail} activeOpacity={0.75}>
            <Card style={styles.actionRow}>
              <Ionicons name="mail-outline" size={22} color={Colors.primary} />
              <View style={styles.actionText}>
                <Text style={styles.actionLabel}>E-mail</Text>
                <Text style={styles.actionValue}>{contact.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Card>
          </TouchableOpacity>
        ) : null}

        {contact.phone ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${contact.phone}`)}
            activeOpacity={0.75}
          >
            <Card style={styles.actionRow}>
              <Ionicons name="call-outline" size={22} color={Colors.primary} />
              <View style={styles.actionText}>
                <Text style={styles.actionLabel}>Telefoon</Text>
                <Text style={styles.actionValue}>{contact.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Card>
          </TouchableOpacity>
        ) : null}

        {!contact.email && !contact.phone && (
          <View style={styles.noContact}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.noContactText}>Geen contactgegevens beschikbaar</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  name: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
  role: { fontSize: 14, color: Colors.textSecondary },
  subject: { fontSize: 13, color: Colors.textMuted },
  section: { padding: Spacing.base, gap: Spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 1 },
  actionValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  noContact: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base },
  noContactText: { fontSize: 14, color: Colors.textMuted },
});
