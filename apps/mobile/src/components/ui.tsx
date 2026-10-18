import { formatInr } from "@expense/core";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

export function AmountRow({ label, paise, hint }: { label: string; paise: number; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={[styles.rowText, { color: theme.text }]} numberOfLines={1}>
          {label}
        </Text>
        {hint ? <Text style={[styles.hint, { color: theme.muted }]}>{hint}</Text> : null}
      </View>
      <Text style={[styles.rowText, styles.amount, { color: theme.text }]}>{formatInr(paise)}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const theme = useTheme();
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? theme.accent : theme.card,
          borderColor: primary ? theme.accent : theme.border,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? theme.onAccent : theme.text }]}>{title}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  rowLabel: { flex: 1 },
  rowText: { fontSize: 16 },
  hint: { fontSize: 13, marginTop: 2 },
  amount: { fontVariant: ["tabular-nums"], fontWeight: "500" },
  button: { borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: "center" },
  buttonText: { fontSize: 16, fontWeight: "600" },
});
