import { Feather } from "@expo/vector-icons";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useRouteContext, type DayRoute, type RouteStop } from "@/context/RouteContext";

const C = Colors.light;

function VisitedStopRow({ stop }: { stop: RouteStop }) {
  return (
    <View style={styles.visitRow}>
      <View style={styles.visitDotCol}>
        <View style={[styles.visitDot, { backgroundColor: C.success }]} />
      </View>
      <View style={styles.visitContent}>
        <Text style={styles.visitName} numberOfLines={1}>{stop.name}</Text>
        {stop.orderValue ? (
          <View style={styles.orderTag}>
            <Feather name="shopping-bag" size={10} color={C.accent} />
            <Text style={styles.orderTagText}>{stop.orderValue}</Text>
          </View>
        ) : null}
        {stop.visitNote ? (
          <Text style={styles.visitNoteText} numberOfLines={2}>{stop.visitNote}</Text>
        ) : null}
        {stop.visitedAt ? (
          <Text style={styles.visitTimeText}>
            {new Date(stop.visitedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function HistoryDayCard({ route }: { route: DayRoute }) {
  const [expanded, setExpanded] = React.useState(false);
  const total = route.stops.length;
  const visited = route.stops.filter((s) => s.status === "visited");
  const visitedCount = visited.length;
  const plannedCount = total - visitedCount;
  const pct = total > 0 ? Math.round((visitedCount / total) * 100) : 0;
  const withOrders = visited.filter((s) => s.orderValue);
  const isToday = route.date === new Date().toISOString().split("T")[0];

  const dateStr = new Date(route.date + "T12:00:00").toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.cardHeader}>
        <View style={styles.dateRow}>
          <View>
            <Text style={styles.dateStr}>{dateStr}</Text>
            {isToday && <Text style={styles.todayLabel}>Dziś</Text>}
          </View>
          <View style={styles.rightHeader}>
            <View style={[styles.pctBadge, { backgroundColor: pct >= 100 ? "#ECFDF5" : "#EFF6FF" }]}>
              <Text style={[styles.pctText, { color: pct >= 100 ? C.success : C.accent }]}>{pct}%</Text>
            </View>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={C.textTertiary} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <MiniStat icon="map-pin" value={total} label="klientów" color={C.accent} />
          <MiniStat icon="check-circle" value={visitedCount} label="odwiedzonych" color={C.success} />
          <MiniStat icon="shopping-bag" value={withOrders.length} label="zamówień" color="#8B5CF6" />
          {plannedCount > 0 && <MiniStat icon="clock" value={plannedCount} label="nie odwiedzono" color={C.warning} />}
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { flex: visitedCount }]} />
          <View style={{ flex: plannedCount, backgroundColor: "#E2E8F0" }} />
        </View>
      </Pressable>

      {expanded && visited.length > 0 && (
        <View style={styles.visitList}>
          <View style={styles.visitListHeader}>
            <Feather name="clipboard" size={13} color={C.textSecondary} />
            <Text style={styles.visitListTitle}>Odwiedzone wizyty</Text>
          </View>
          {visited.map((s) => <VisitedStopRow key={s.id} stop={s} />)}
          {route.stops.filter((s) => s.status !== "visited").length > 0 && (
            <View style={styles.skippedSection}>
              <Text style={styles.skippedLabel}>Pominięte / Nieodwiedzone:</Text>
              {route.stops.filter((s) => s.status !== "visited").map((s) => (
                <View key={s.id} style={styles.skippedRow}>
                  <View style={[styles.visitDot, { backgroundColor: C.textTertiary }]} />
                  <Text style={styles.skippedName}>{s.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function MiniStat({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <View style={styles.miniStat}>
      <Feather name={icon as any} size={12} color={color} />
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { routes } = useRouteContext();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sortedRoutes = React.useMemo(
    () => [...routes].filter((r) => r.stops.length > 0).sort((a, b) => b.date.localeCompare(a.date)),
    [routes]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedRoutes}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <HistoryDayCard route={item} />}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPad + 16 }]}>
            <Text style={styles.heroTitle}>Historia</Text>
            <Text style={styles.subtitle}>Twoje poprzednie trasy i raporty</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>Brak historii</Text>
            <Text style={styles.emptySubtitle}>Tu pojawią się raporty z poprzednich dni</Text>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  listContent: { paddingHorizontal: 16 },
  header: { paddingBottom: 20 },
  heroTitle: { fontSize: 28, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular", marginTop: 2 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
    overflow: "hidden",
  },
  cardHeader: { padding: 16 },
  dateRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  dateStr: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  todayLabel: { fontSize: 11, color: C.accent, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  rightHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  pctBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pctText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" },
  miniStat: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.backgroundTertiary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  miniValue: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  miniLabel: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  progressBar: { height: 5, borderRadius: 3, flexDirection: "row", backgroundColor: C.backgroundTertiary, overflow: "hidden" },
  progressFill: { backgroundColor: C.success },
  visitList: { borderTopWidth: 1, borderTopColor: C.borderLight, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12, gap: 0 },
  visitListHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  visitListTitle: { fontSize: 12, fontWeight: "600", color: C.textSecondary, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  visitRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  visitDotCol: { paddingTop: 4 },
  visitDot: { width: 8, height: 8, borderRadius: 4 },
  visitContent: { flex: 1, gap: 3 },
  visitName: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  orderTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderTagText: { fontSize: 12, color: C.accent, fontFamily: "Inter_600SemiBold" },
  visitNoteText: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  visitTimeText: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  skippedSection: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.borderLight, gap: 6 },
  skippedLabel: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_500Medium", marginBottom: 4 },
  skippedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  skippedName: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center" },
});
