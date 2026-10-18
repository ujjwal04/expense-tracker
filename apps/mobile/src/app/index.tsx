import { formatInr, shiftMonth, summarizeMonth } from "@expense/core";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AmountRow, Button, Section } from "@/components/ui";
import { accountLabel, currentMonth, monthLabel } from "@/format";
import { useMonthTransactions } from "@/hooks/useMonthTransactions";
import { useTheme } from "@/theme";

const byAmount = (totals: Record<string, number>) => Object.entries(totals).sort(([, a], [, b]) => b - a);

export default function Dashboard() {
  const theme = useTheme();
  const [month, setMonth] = useState(currentMonth);
  const { transactions, error, cashMode } = useMonthTransactions(month);
  const summary = useMemo(() => summarizeMonth(transactions, month, { cashMode }), [transactions, month, cashMode]);
  const isCurrentMonth = month === currentMonth();
  const cashEntries = byAmount(summary.cashBreakdown);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.monthBar}>
        <MonthArrow label="‹" accessibilityLabel="Previous month" onPress={() => setMonth(shiftMonth(month, -1))} />
        <Text style={[styles.month, { color: theme.text }]}>{monthLabel(month)}</Text>
        <MonthArrow
          label="›"
          accessibilityLabel="Next month"
          disabled={isCurrentMonth}
          onPress={() => setMonth(shiftMonth(month, 1))}
        />
      </View>

      <Text style={[styles.total, { color: theme.text }]}>{formatInr(summary.spendPaise)}</Text>
      <Text style={[styles.caption, { color: theme.muted }]}>
        spent{summary.refundsPaise > 0 ? ` after ${formatInr(summary.refundsPaise)} in refunds` : ""}
      </Text>
      {error ? <Text style={[styles.caption, { color: theme.negative }]}>Couldn't load: {error}</Text> : null}

      <Section title="Fixed vs variable">
        <AmountRow label="Fixed" hint="EMIs, subscriptions, autopay" paise={summary.fixedPaise} />
        <AmountRow label="Variable" paise={summary.variablePaise} />
      </Section>

      {transactions.length === 0 ? (
        <Text style={[styles.empty, { color: theme.muted }]}>
          No transactions this month yet. Bank SMS arrive through the iOS Shortcut, or add a cash expense below.
        </Text>
      ) : (
        <>
          <Section title="By category">
            {byAmount(summary.byCategory).map(([category, paise]) => (
              <AmountRow key={category} label={category} paise={paise} />
            ))}
          </Section>

          <Section title="By account">
            {byAmount(summary.byAccount).map(([key, paise]) => (
              <AmountRow key={key} label={accountLabel(key)} paise={paise} />
            ))}
          </Section>

          {cashEntries.length > 0 ? (
            <Section title="Where the cash went">
              {cashEntries.map(([category, paise]) => (
                <AmountRow key={category} label={category} paise={paise} />
              ))}
            </Section>
          ) : null}

          <Section title="Not counted as spending">
            <AmountRow label="Income" paise={summary.excluded.incomePaise} />
            <AmountRow label="Transfers" hint="Card bill payments, own accounts" paise={summary.excluded.transfersPaise} />
            <AmountRow label="Investments" paise={summary.excluded.investmentsPaise} />
          </Section>
        </>
      )}

      <View style={styles.actions}>
        <Button title="All transactions" variant="secondary" onPress={() => router.push({ pathname: "/transactions", params: { month } })} />
        <Button title="Paste bank SMS" variant="secondary" onPress={() => router.push("/add")} />
        <Button title="Add cash expense" onPress={() => router.push("/cash")} />
        <Button title="Settings" variant="secondary" onPress={() => router.push("/settings")} />
      </View>
    </ScrollView>
  );
}

function MonthArrow({
  label,
  accessibilityLabel,
  onPress,
  disabled = false,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      hitSlop={12}
      style={styles.arrow}
    >
      <Text style={[styles.arrowText, { color: disabled ? theme.border : theme.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  month: { fontSize: 17, fontWeight: "600" },
  arrow: { paddingHorizontal: 12, paddingVertical: 4 },
  arrowText: { fontSize: 28, fontWeight: "500" },
  total: { fontSize: 44, fontWeight: "700", textAlign: "center", marginTop: 20, fontVariant: ["tabular-nums"] },
  caption: { fontSize: 15, textAlign: "center", marginTop: 4 },
  empty: { fontSize: 15, textAlign: "center", marginTop: 32, lineHeight: 21 },
  actions: { marginTop: 32, gap: 12 },
});
