import { istDate, parseAmountToPaise } from "@expense/core";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui";
import { insertTransaction } from "@/db/transactions";
import { useTheme } from "@/theme";

export default function CashExpense() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }];

  async function save() {
    const amountPaise = parseAmountToPaise(amount);
    if (!amountPaise) {
      setError("Enter an amount like 250 or 99.50");
      return;
    }
    setSaving(true);
    try {
      await insertTransaction(db, {
        amountPaise,
        direction: "DEBIT",
        kind: "EXPENSE",
        date: istDate(new Date()),
        merchant: description.trim() || null,
        category: category.trim() || null,
        accountType: "CASH",
        accountLast4: null,
        channel: "CASH",
        source: "MANUAL",
        fixed: false,
      });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Amount (₹)">
          <TextInput
            style={[...inputStyle, styles.amountInput]}
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.muted}
            autoFocus
          />
        </Field>
        <Field label="What for">
          <TextInput
            style={inputStyle}
            value={description}
            onChangeText={setDescription}
            placeholder="Auto, chai, vegetables…"
            placeholderTextColor={theme.muted}
          />
        </Field>
        <Field label="Category">
          <TextInput
            style={inputStyle}
            value={category}
            onChangeText={setCategory}
            placeholder="Food, Travel…"
            placeholderTextColor={theme.muted}
          />
        </Field>

        {error ? <Text style={[styles.message, { color: theme.negative }]}>{error}</Text> : null}
        <Text style={[styles.message, { color: theme.muted }]}>
          ATM withdrawals already count as spending, so cash expenses show where that cash went without being added to
          the total again.
        </Text>

        <Button title={saving ? "Saving…" : "Save"} onPress={save} disabled={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 4 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  amountInput: { fontSize: 28, fontWeight: "600" },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
});
