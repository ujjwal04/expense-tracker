import { accountKey, formatInr, type Transaction } from "@expense/core";
import { Stack, useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { accountLabel, currentMonth, dayLabel, KIND_LABELS, monthLabel } from "@/format";
import { useMonthTransactions } from "@/hooks/useMonthTransactions";
import { useTheme, type Theme } from "@/theme";

export default function Transactions() {
  const theme = useTheme();
  const { month = currentMonth() } = useLocalSearchParams<{ month?: string }>();
  const { transactions, error } = useMonthTransactions(month);

  return (
    <>
      <Stack.Screen options={{ title: monthLabel(month) }} />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        data={transactions}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.border }]} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: error ? theme.negative : theme.muted }]}>
            {error ? `Couldn't load: ${error}` : "No transactions this month."}
          </Text>
        }
      />
    </>
  );
}

function TransactionRow({ transaction: t }: { transaction: Transaction }) {
  const theme = useTheme();
  const { color, sign } = amountStyle(t, theme);
  const counted = t.kind === "EXPENSE" || t.kind === "REFUND";
  const details = [dayLabel(t.date), accountLabel(accountKey(t)), t.category, counted ? null : KIND_LABELS[t.kind]];

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={[styles.merchant, { color: theme.text }]} numberOfLines={1}>
          {t.merchant ?? KIND_LABELS[t.kind]}
        </Text>
        <Text style={[styles.details, { color: theme.muted }]} numberOfLines={1}>
          {details.filter(Boolean).join(" · ")}
          {t.fixed ? " · Fixed" : ""}
        </Text>
      </View>
      <Text style={[styles.amount, { color }]}>
        {sign}
        {formatInr(t.amountPaise)}
      </Text>
    </View>
  );
}

/** Spend in normal text, money coming back in green, and money that only moved in grey. */
function amountStyle(t: Transaction, theme: Theme): { color: string; sign: string } {
  switch (t.kind) {
    case "EXPENSE":
      return { color: theme.text, sign: "" };
    case "INCOME":
    case "REFUND":
      return { color: theme.positive, sign: "+" };
    case "TRANSFER":
    case "INVESTMENT":
      return { color: theme.muted, sign: "" };
  }
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  rowMain: { flex: 1 },
  merchant: { fontSize: 16, fontWeight: "500" },
  details: { fontSize: 13, marginTop: 3 },
  amount: { fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] },
  separator: { height: StyleSheet.hairlineWidth },
  empty: { fontSize: 15, textAlign: "center", marginTop: 48 },
});
