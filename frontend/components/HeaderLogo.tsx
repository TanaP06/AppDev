import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  description?: string;
  showDivider?: boolean;
}

export default function HeaderLogo({ description, showDivider = true }: Props) {
  return (
    <View style={[styles.container, showDivider && styles.cardContainer]}>
      <View style={styles.headerRow}>
        <View style={styles.iconBg}>
          <Ionicons name="refresh" size={38} color={Colors.surface} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.appName}>CampusLoop</Text>
          <Text style={styles.subtitle}>BUY SMART. SELL EASY. REPEAT.</Text>
        </View>
      </View>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    paddingTop: 56,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconBg: {
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 0,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
});
