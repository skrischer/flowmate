// "Was [Mate] sieht" transparency card (#101): data-sovereignty centrepiece shown
// on the Flower · "Was mein Mate sieht" preview screen (/mate-preview, #156).
// Lists only phase-level fields shared
// via shared_state — never raw logs, moods, or exact dates. Row values are
// illustrative labels, not live data. Lock footnote makes the guarantee explicit.
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../lib/theme';
// spacing.screen (22) doubles as the card padding token — matches the design's
// 22–24px card padding and replaces the previous hardcoded literal.
import { Icon } from '../../components/Icon';

function TransparencyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function TransparencyCard({ mateName }: { mateName: string | null }) {
  // Unified self-referential copy ("mein Mate") — the Flower views her own
  // sharing surface, never "dein Mate" (findings: /mate-preview header copy).
  const label = mateName ?? 'mein Mate';
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name="eye" size={18} color={colors.textMuted} />
        <Text style={styles.title}>Was {label} sieht</Text>
      </View>

      <View style={styles.list}>
        <TransparencyRow label="Aktuelle Phase" value="z.B. Lutealphase" />
        <TransparencyRow label="Vorwarnung zur Periode" value="z.B. ~5 Tage" />
        <TransparencyRow label="Einstimmungshinweis" value="sanfter Hinweis" />
      </View>

      <View style={styles.lockNote}>
        <Icon name="lock" size={14} color={colors.textSubtle} />
        <Text style={styles.lockText}>
          Nie deine Einträge, Stimmungen oder genauen Daten.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.screen,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: colors.text, ...typography.h2, flex: 1 },
  list: { gap: 10 },
  // flex-start so a value that wraps to two lines stays top-aligned with its
  // label instead of vertically centering against it (findings: row alignment).
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowLabel: { color: colors.textMuted, ...typography.bodySm, flex: 1 },
  rowValue: { color: colors.text, ...typography.bodySm, flex: 1, textAlign: 'right' },
  lockNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingTop: 2 },
  lockText: { color: colors.textSubtle, ...typography.caption, flex: 1 },
});
