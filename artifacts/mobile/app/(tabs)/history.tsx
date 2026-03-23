import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useRouteContext, type DayRoute, type RouteStop } from "@/context/RouteContext";

const C = Colors.light;

function VisitedStopRow({ stop }: { stop: RouteStop }) {
  return (
    <View style={styles.visitRow}>
      <View style={styles.visitDotTrack}>
        <View style={styles.visitDot} />
        <View style={styles.visitLine} />
      </View>
      <View style={styles.visitContent}>
        <Text style={styles.visitName} numberOfLines={1}>{stop.name}</Text>
        {stop.orderValue ? (
          <View style={styles.orderTag}>
            <Feather name="shopping-bag" size={10} color="#8B5CF6" />
            <Text style={styles.orderTagText}>{stop.orderValue}</Text>
          </View>
        ) : null}
        {stop.visitNote ? <Text style={styles.visitNoteText} numberOfLines={2}>{stop.visitNote}</Text> : null}
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
  const pct = total > 0 ? Math.round((visitedCount / total) * 100) : 0;
  const withOrders = visited.filter((s) => s.orderValue);
  const isToday = route.date === new Date().toISOString().split("T")[0];
  const dateStr = new Date(route.date + "T12:00:00").toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.cardHeader}>
        <View style={styles.dateBlock}>
          <View style={[styles.datePct, { backgroundColor: pct >= 100 ? "#D1FAE5" : pct > 0 ? "#DBEAFE" : C.backgroundTertiary }]}>
            <Text style={[styles.datePctNum, { color: pct >= 100 ? C.success : pct > 0 ? C.accent : C.textTertiary }]}>{pct}%</Text>
          </View>
          <View>
            <Text style={styles.dateStr}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</Text>
            {isToday && <View style={styles.todayTag}><Text style={styles.todayTagText}>Dziś</Text></View>}
          </View>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={C.textTertiary} />
      </Pressable>

      <View style={styles.statsRow}>
        <MiniStat icon="map-pin" value={total} label="klientów" color={C.accent} bg="#DBEAFE" />
        <MiniStat icon="check-circle" value={visitedCount} label="odwiedz." color={C.success} bg="#D1FAE5" />
        <MiniStat icon="shopping-bag" value={withOrders.length} label="zamówień" color="#8B5CF6" bg="#EDE9FE" />
        {total - visitedCount > 0 && <MiniStat icon="x-circle" value={total - visitedCount} label="pominięte" color={C.textTertiary} bg={C.backgroundTertiary} />}
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { flex: Math.max(visitedCount, 0.001) }]} />
        <View style={{ flex: Math.max(total - visitedCount, 0.001), backgroundColor: C.backgroundTertiary }} />
      </View>

      {expanded && visited.length > 0 && (
        <View style={styles.visitList}>
          <Text style={styles.visitListLabel}>WIZYTY</Text>
          {visited.map((s, i) => <VisitedStopRow key={s.id} stop={s} />)}
          {route.stops.filter((s) => s.status !== "visited").length > 0 && (
            <View style={styles.skippedSection}>
              <Text style={styles.skippedLabel}>NIEODWIEDZONE</Text>
              {route.stops.filter((s) => s.status !== "visited").map((s) => (
                <View key={s.id} style={styles.skippedRow}>
                  <Feather name="minus-circle" size={12} color={C.textTertiary} />
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

function MiniStat({ icon, value, label, color, bg }: { icon: string; value: number; label: string; color: string; bg: string }) {
  return (
    <View style={[styles.miniStat, { backgroundColor: bg }]}>
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

  const allVisits = sortedRoutes.flatMap((r) => r.stops).filter((s) => s.status === "visited").length;

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedRoutes}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <View style={styles.cardWrapper}><HistoryDayCard route={item} /></View>}
        ListHeaderComponent={
          <LinearGradient colors={["#0F1D3D", "#162950", "#1E3A5F"]} style={[styles.heroCard, { paddingTop: topPad + 20 }]}>
            <Text style={styles.heroLabel}>HISTORIA PRACY</Text>
            <Text style={styles.heroTitle}>Historia</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{sortedRoutes.length}</Text>
                <Text style={styles.heroStatLabel}>dni pracy</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{allVisits}</Text>
                <Text style={styles.heroStatLabel}>wizyt łącznie</Text>
              </View>
            </View>
          </LinearGradient>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyRing2}>
              <View style={styles.emptyRing1}>
                <View style={styles.emptyIconCenter}><Feather name="calendar" size={28} color="#fff" /></View>
              </View>
            </View>
            <Text style={styles.emptyTitle}>Brak historii</Text>
            <Text style={styles.emptySub}>Tu będą widoczne podsumowania każdego dnia pracy z wizytami i raportami.</Text>
          </View>
        }
        contentContainerStyle={[{ paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  heroCard: { paddingHorizontal: 20, paddingBottom: 24, marginBottom: 16 },
  heroLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold", marginBottom: 18 },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 24, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.12)" },
  cardWrapper: { paddingHorizontal: 16, marginBottom: 0 },
  card: {
    backgroundColor: C.surface, borderRadius: 18, marginBottom: 12,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingBottom: 14 },
  dateBlock: { flexDirection: "row", alignItems: "center", gap: 12 },
  datePct: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  datePctNum: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  dateStr: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  todayTag: { backgroundColor: "#DBEAFE", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: "flex-start", marginTop: 3 },
  todayTagText: { fontSize: 10, color: C.accent, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingBottom: 14, flexWrap: "wrap" },
  miniStat: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  miniValue: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  miniLabel: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  progressBar: { height: 5, flexDirection: "row", marginHorizontal: 16, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { backgroundColor: C.success },
  visitList: { borderTopWidth: 1, borderTopColor: C.borderLight, padding: 16, paddingTop: 14 },
  visitListLabel: { fontSize: 10, fontWeight: "700", color: C.textTertiary, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 },
  visitRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  visitDotTrack: { alignItems: "center", paddingTop: 2 },
  visitDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success, flexShrink: 0 },
  visitLine: { flex: 1, width: 1.5, backgroundColor: "#BBF7D0", marginTop: 4 },
  visitContent: { flex: 1, gap: 4, paddingBottom: 8 },
  visitName: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  orderTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderTagText: { fontSize: 12, color: "#8B5CF6", fontFamily: "Inter_600SemiBold" },
  visitNoteText: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  visitTimeText: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  skippedSection: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.borderLight, gap: 6 },
  skippedLabel: { fontSize: 10, fontWeight: "700", color: C.textTertiary, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 },
  skippedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  skippedName: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 28, gap: 0 },
  emptyRing2: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  emptyRing1: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#BFDBFE", alignItems: "center", justifyContent: "center" },
  emptyIconCenter: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  emptySub: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});
