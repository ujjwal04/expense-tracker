import { useColorScheme } from "react-native";

const light = {
  background: "#F5F6F8",
  card: "#FFFFFF",
  text: "#111418",
  muted: "#5F6B7A",
  border: "#E3E6EA",
  accent: "#2563EB",
  onAccent: "#FFFFFF",
  positive: "#15803D",
  negative: "#B91C1C",
};

const dark: Theme = {
  background: "#0D0F12",
  card: "#171A1F",
  text: "#F2F4F7",
  muted: "#9AA4B2",
  border: "#262B33",
  accent: "#60A5FA",
  onAccent: "#0D0F12",
  positive: "#4ADE80",
  negative: "#F87171",
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}
