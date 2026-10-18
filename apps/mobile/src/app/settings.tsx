import type { CashMode } from "@expense/core";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui";
import { DEFAULT_CASH_MODE, getCashMode, getOwnerNames, saveCashMode, saveOwnerNames } from "@/db/settings";
import { useTheme } from "@/theme";

export default function Settings() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const [names, setNames] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [cashMode, setCashMode] = useState<CashMode>(DEFAULT_CASH_MODE);

  useEffect(() => {
    getCashMode(db).then(setCashMode).catch(() => undefined);
    getOwnerNames(db)
      .then((saved) => setNames(saved.join(", ")))
      .catch((e: unknown) => setMessage({ text: e instanceof Error ? e.message : String(e), isError: true }));
  }, [db]);

  function changeCashMode(countEntries: boolean) {
    const mode: CashMode = countEntries ? "ENTRIES" : "WITHDRAWALS";
    setCashMode(mode);
    saveCashMode(db, mode).catch((e: unknown) =>
      setMessage({ text: e instanceof Error ? e.message : String(e), isError: true }),
    );
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await saveOwnerNames(db, names.split(","));
      if (updated > 0) {
        setMessage({ text: `Saved. ${updated} past transfer${updated === 1 ? "" : "s"} marked as self transfer.`, isError: false });
        setSaving(false);
      } else {
        router.back();
      }
    } catch (e: unknown) {
      setMessage({ text: e instanceof Error ? e.message : String(e), isError: true });
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: theme.muted }]}>Your name</Text>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
          value={names}
          onChangeText={(text) => {
            setNames(text);
            setMessage(null);
          }}
          placeholder="As it appears in bank messages"
          placeholderTextColor={theme.muted}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Text style={[styles.hint, { color: theme.muted }]}>
          Money you send to or receive from this name counts as a self transfer between your own accounts, not as
          spending. Add other spellings separated by commas. Stays on this phone only.
        </Text>

        {message ? (
          <Text style={[styles.hint, { color: message.isError ? theme.negative : theme.positive }]}>{message.text}</Text>
        ) : null}
        <Button title={saving ? "Saving…" : "Save"} onPress={save} disabled={saving} />

        <Text style={[styles.label, styles.section, { color: theme.muted }]}>Cash</Text>
        <View style={[styles.switchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Count cash expenses as spending</Text>
          <Switch value={cashMode === "ENTRIES"} onValueChange={changeCashMode} />
        </View>
        <Text style={[styles.hint, { color: theme.muted }]}>
          {cashMode === "ENTRIES"
            ? "Cash expenses you add count toward the total. ATM withdrawals only move money into your wallet, so they don't count."
            : "ATM withdrawals count as spending. Cash expenses you add only show where that cash went, so it isn't counted twice."}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginLeft: 4, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 16, marginLeft: 4 },
  section: { marginTop: 24 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchLabel: { flex: 1, fontSize: 16 },
});
