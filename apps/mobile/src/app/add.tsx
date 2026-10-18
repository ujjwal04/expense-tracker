import { formatInr } from "@expense/core";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui";
import { KIND_LABELS } from "@/format";
import { ingestSms, type SmsIngestOutcome } from "@/ingest/sms";
import { useTheme } from "@/theme";

// Opened by the iOS Shortcut (expensetracker://add?sms=<url-encoded message>),
// or from the dashboard with no message, to paste one that the Shortcut missed.
const SmsTextSchema = z.string().trim().min(1).max(2000);

type ScreenState =
  | { status: "paste" }
  | { status: "working" }
  | { status: "invalid" }
  | { status: "error"; message: string }
  | SmsIngestOutcome;

export default function AddFromSms() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { sms } = useLocalSearchParams<{ sms?: string }>();
  const [state, setState] = useState<ScreenState>(() => initialState(sms));
  const [pasted, setPasted] = useState("");
  const handled = useRef<string | null>(null);

  // Stores the message and shows the outcome; state only changes once the import finishes.
  const save = useCallback(
    (body: string) => {
      ingestSms(db, body)
        .then(setState)
        .catch((e: unknown) => setState({ status: "error", message: e instanceof Error ? e.message : String(e) }));
    },
    [db],
  );

  useEffect(() => {
    const body = SmsTextSchema.safeParse(sms);
    // Effects can run twice in development; never store the same message twice.
    if (!body.success || handled.current === body.data) return;
    handled.current = body.data;
    save(body.data);
  }, [sms, save]);

  function importPasted() {
    const body = SmsTextSchema.safeParse(pasted);
    if (!body.success) {
      setState({ status: "invalid" });
      return;
    }
    setState({ status: "working" });
    save(body.data);
  }

  if (state.status === "paste") {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.paste}>
        <Text style={[styles.detail, { color: theme.muted }]}>
          Copy a bank SMS from Messages (long-press it → Copy) and paste it here.
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
          value={pasted}
          onChangeText={setPasted}
          placeholder="Paste the message"
          placeholderTextColor={theme.muted}
          multiline
          autoFocus
        />
        <Button title="Import" onPress={importPasted} disabled={!pasted.trim()} />
      </KeyboardAvoidingView>
    );
  }

  const { title, detail } = describe(state);
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {detail ? <Text style={[styles.detail, { color: theme.muted }]}>{detail}</Text> : null}
      {/* Back to the existing dashboard; replace() would stack a second one on top. */}
      {state.status !== "working" ? <Button title="Done" onPress={() => router.dismissTo("/")} /> : null}
    </View>
  );
}

function initialState(sms: string | undefined): ScreenState {
  if (sms === undefined) return { status: "paste" };
  return SmsTextSchema.safeParse(sms).success ? { status: "working" } : { status: "invalid" };
}

function describe(state: Exclude<ScreenState, { status: "paste" }>): { title: string; detail?: string } {
  switch (state.status) {
    case "working":
      return { title: "Reading message…" };
    case "saved": {
      const t = state.transaction;
      return {
        title: `Saved ${formatInr(t.amountPaise)}`,
        detail: [t.merchant, KIND_LABELS[t.kind]].filter(Boolean).join(" · "),
      };
    }
    case "duplicate":
      return { title: "Already recorded", detail: "This payment is already saved, so it wasn't added again." };
    case "not-a-transaction":
      return { title: "Nothing to save", detail: "This message doesn't look like a transaction (e.g. an OTP or a reminder)." };
    case "invalid":
      return { title: "No message received", detail: "Check that the Shortcut passes the message text to the link." };
    case "error":
      return { title: "Couldn't save", detail: state.message };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  paste: { flex: 1, padding: 16, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  detail: { fontSize: 16, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, minHeight: 140, textAlignVertical: "top" },
});
