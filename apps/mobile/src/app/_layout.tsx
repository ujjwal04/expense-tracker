import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { migrate } from "@/db/schema";
import { useTheme } from "@/theme";

export default function RootLayout() {
  const theme = useTheme();
  return (
    <SQLiteProvider databaseName="expenses.db" onInit={migrate}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Spending" }} />
        <Stack.Screen name="transactions" options={{ title: "Transactions" }} />
        <Stack.Screen name="cash" options={{ title: "Cash expense", presentation: "modal" }} />
        <Stack.Screen name="add" options={{ title: "Bank SMS", presentation: "modal" }} />
      </Stack>
    </SQLiteProvider>
  );
}
