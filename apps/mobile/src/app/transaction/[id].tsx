import { CATEGORIES, formatInr, ruleFromCorrection, type Transaction, type TransactionKind } from "@expense/core";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Button } from "@/components/ui";
import { learnCategoryRule } from "@/db/categoryRules";
import { getTransaction, updateTransaction } from "@/db/transactions";
import { dayLabel, KIND_LABELS } from "@/format";
import { useTheme } from "@/theme";

const KINDS: readonly TransactionKind[] = ["EXPENSE", "TRANSFER", "INCOME", "INVESTMENT", "REFUND"];

const KIND_HINTS: Record<TransactionKind, string> = {
  EXPENSE: "Counts as spending.",
  TRANSFER: "Money moved between your own accounts or to a card bill. Not spending.",
  INCOME: "Money received. Not spending.",
  INVESTMENT: "SIPs, stocks, deposits. Not spending.",
  REFUND: "Money back from a purchase. Reduces spending.",
};

export default function EditTransaction() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [original, setOriginal] = useState<Transaction | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [kind, setKind] = useState<TransactionKind>("EXPENSE");
  const [fixed, setFixed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTransaction(db, id)
      .then((t) => {
        if (!t) return setError("This transaction no longer exists.");
        setOriginal(t);
        setCategory(t.category);
        setKind(t.kind);
        setFixed(t.fixed);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [db, id]);

  async function save() {
    if (!original) return;
    setSaving(true);
    try {
      await updateTransaction(db, original.id, { category, kind, fixed });
      // A category correction becomes a rule, so this merchant is categorized automatically from now on.
      const rule = category && category !== original.category ? ruleFromCorrection(original.merchant, category) : null;
      if (rule) await learnCategoryRule(db, rule);
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  if (!original) {
    return (
      <Text style={[styles.message, { color: error ? theme.negative : theme.muted }]}>{error ?? "Loading…"}</Text>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: original.merchant ?? KIND_LABELS[original.kind] }} />
      <Text style={[styles.amount, { color: theme.text }]}>{formatInr(original.amountPaise)}</Text>
      <Text style={[styles.message, { color: theme.muted }]}>{dayLabel(original.date)}</Text>

      <Text style={[styles.label, { color: theme.muted }]}>Category</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((name) => (
          <Chip key={name} label={name} selected={category === name} onPress={() => setCategory(name)} />
        ))}
      </View>
      {original.merchant ? (
        <Text style={[styles.hint, { color: theme.muted }]}>
          Future payments to {original.merchant} will use this category too.
        </Text>
      ) : null}

      <Text style={[styles.label, { color: theme.muted }]}>Type</Text>
      <View style={styles.chips}>
        {KINDS.map((k) => (
          <Chip key={k} label={KIND_LABELS[k]} selected={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>
      <Text style={[styles.hint, { color: theme.muted }]}>{KIND_HINTS[kind]}</Text>

      <View style={[styles.switchRow, { borderColor: theme.border }]}>
        <View style={styles.switchText}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Fixed</Text>
          <Text style={[styles.hint, { color: theme.muted }]}>Recurring commitments like rent, EMIs, subscriptions</Text>
        </View>
        <Switch value={fixed} onValueChange={setFixed} />
      </View>

      {error ? <Text style={[styles.hint, { color: theme.negative }]}>{error}</Text> : null}
      <View style={styles.save}>
        <Button title={saving ? "Saving…" : "Save"} onPress={save} disabled={saving} />
      </View>
    </ScrollView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? theme.accent : theme.border, backgroundColor: selected ? theme.accent : theme.card },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? theme.onAccent : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  amount: { fontSize: 36, fontWeight: "700", textAlign: "center", marginTop: 8, fontVariant: ["tabular-nums"] },
  message: { fontSize: 15, textAlign: "center", marginTop: 4, padding: 16 },
  label: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginTop: 20, marginBottom: 10, marginLeft: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, lineHeight: 18, marginTop: 8, marginLeft: 4 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  switchText: { flex: 1 },
  switchLabel: { fontSize: 16, fontWeight: "500" },
  save: { marginTop: 28 },
});
