import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.light;

interface StatsBarProps {
  total: number;
  visited: number;
  active: number;
  planned: number;
  visitedPct: number;
}

export function StatsBar({ total, visited, active, planned, visitedPct }: StatsBarProps) {
  if (total === 0) return null;
  return (
    <View style={styles.container}>
      <Stat value={planned} label="Plan" color={C.statusPlanned} bg="#DBEAFE" />
      <Stat value={active} label="Aktywne" color={C.statusActive} bg="#FEF3C7" />
      <Stat value={visited} label="Gotowe" color={C.statusVisited} bg="#D1FAE5" />
      <View style={styles.pctCol}>
        <Text style={styles.pctNum}>{visitedPct}%</Text>
        <Text style={styles.pctLabel}>Ukończone</Text>
        <View style={styles.miniBar}>
          <View style={[styles.miniFill, { flex: visited }]} />
          <View style={[styles.miniRest, { flex: Math.max(total - visited, 0.001) }]} />
        </View>
      </View>
    </View>
  );
}

function Stat({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", gap: 8, marginBottom: 14,
  },
  statBox: {
    flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", gap: 2,
  },
  statNum: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.3, opacity: 0.8 },
  pctCol: {
    flex: 1.1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", gap: 2,
  },
  pctNum: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  pctLabel: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.3 },
  miniBar: { flexDirection: "row", height: 4, borderRadius: 2, overflow: "hidden", width: "100%", marginTop: 4 },
  miniFill: { backgroundColor: C.statusVisited },
  miniRest: { backgroundColor: C.backgroundTertiary },
});
