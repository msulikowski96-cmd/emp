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
      <View style={styles.numbers}>
        <StatItem value={planned} label="Zaplanowane" color={C.statusPlanned} />
        <View style={styles.divider} />
        <StatItem value={active} label="W trakcie" color={C.statusActive} />
        <View style={styles.divider} />
        <StatItem value={visited} label="Odwiedzone" color={C.statusVisited} />
        <View style={styles.divider} />
        <StatItem value={`${visitedPct}%`} label="Ukończone" color={C.text} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressVisited, { flex: visited }]} />
        <View style={[styles.progressActive, { flex: active }]} />
        <View style={[styles.progressPlanned, { flex: planned }]} />
      </View>
    </View>
  );
}

function StatItem({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  numbers: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: C.border,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: "row",
    backgroundColor: C.backgroundTertiary,
    overflow: "hidden",
  },
  progressVisited: {
    backgroundColor: C.statusVisited,
  },
  progressActive: {
    backgroundColor: C.statusActive,
  },
  progressPlanned: {
    backgroundColor: C.statusPlanned,
    opacity: 0.3,
  },
});
