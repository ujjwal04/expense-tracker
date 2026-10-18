import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import type { SQLiteDatabase } from "expo-sqlite";
import { categorizeUncategorized } from "@/db/categoryRules";
import { migrate } from "@/db/schema";
import { useTheme } from "@/theme";

async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await migrate(db);
  await categorizeUncategorized(db);
}

export default function RootLayout() {
  const theme = useTheme();
  return (
    <SQLiteProvider databaseName="expenses.db" onInit={initDatabase}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          // Modal headers are translucent by default on recent iOS, which hides the top of the content.
          headerTransparent: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Spending" }} />
        <Stack.Screen name="transactions" options={{ title: "Transactions" }} />
        <Stack.Screen name="cash" options={{ title: "Cash expense", presentation: "modal" }} />
        <Stack.Screen name="add" options={{ title: "Bank SMS", presentation: "modal" }} />
        <Stack.Screen name="transaction/[id]" options={{ title: "Edit", presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </SQLiteProvider>
  );
}
