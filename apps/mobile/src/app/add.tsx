import { formatInr } from "@expense/core";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui";
import { KIND_LABELS } from "@/format";
import { ingestSms, type SmsIngestOutcome } from "@/ingest/sms";
import { useTheme } from "@/theme";

// Opened by the iOS Shortcut: expensetracker://add?sms=<url-encoded message>
const SmsParamSchema = z.string().trim().min(1).max(2000);

type ScreenState = { status: "working" } | { status: "invalid" } | { status: "error"; message: string } | SmsIngestOutcome;

export default function AddFromSms() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { sms } = useLocalSearchParams<{ sms?: string }>();
  const [state, setState] = useState<ScreenState>({ status: "working" });
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const body = SmsParamSchema.safeParse(sms);
    if (!body.success) {
      setState({ status: "invalid" });
      return;
    }
    // Effects can run twice in development; never store the same message twice.
    if (handled.current === body.data) return;
    handled.current = body.data;
    ingestSms(db, body.data)
      .then(setState)
      .catch((e: unknown) => setState({ status: "error", message: e instanceof Error ? e.message : String(e) }));
  }, [db, sms]);

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

function describe(state: ScreenState): { title: string; detail?: string } {
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
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  detail: { fontSize: 16, textAlign: "center", lineHeight: 22, marginBottom: 24 },
});
