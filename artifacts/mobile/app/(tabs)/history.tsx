import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useRouteContext, type DayRoute } from "@/context/RouteContext";

const C = Colors.light;

function HistoryDayCard({ route }: { route: DayRoute }) {
  const totalStops = route.stops.length;
  const visitedStops = route.stops.filter((s) => s.status === "visited").length;
  const pct = totalStops > 0 ? Math.round((visitedStops / totalStops) * 100) : 0;

  const dateStr = new Date(route.date + "T12:00:00").toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const isToday = route.date === new Date().toISOString().split("T")[0];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardDate}>
          <Text style={styles.dateStr}>{dateStr}</Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>Dziś</Text>
            </View>
          )}
        </View>
        <View style={[styles.pctBadge, { backgroundColor: pct >= 100 ? "#ECFDF5" : "#EFF6FF" }]}>
          <Text style={[styles.pctText, { color: pct >= 100 ? C.success : C.accent }]}>{pct}%</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatChip icon="map-pin" value={totalStops} label="punktów" color={C.accent} />
        <StatChip icon="check-circle" value={visitedStops} label="odwiedzonych" color={C.success} />
        <StatChip icon="clock" value={totalStops - visitedStops} label="pozostałych" color={C.warning} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { flex: visitedStops, backgroundColor: C.success }]} />
        <View style={[styles.progressEmpty, { flex: totalStops - visitedStops }]} />
      </View>

      {route.stops.length > 0 && (
        <View style={styles.stopPreview}>
          {route.stops.slice(0, 3).map((stop, idx) => (
            <View key={stop.id} style={styles.stopRow}>
              <View style={[styles.stopDot, { backgroundColor: stop.status === "visited" ? C.success : C.accent }]} />
              <Text style={[styles.stopName, stop.status === "visited" && styles.stopNameVisited]} numberOfLines={1}>
                {stop.name}
              </Text>
            </View>
          ))}
          {route.stops.length > 3 && (
            <Text style={styles.moreStops}>+{route.stops.length - 3} więcej</Text>
          )}
        </View>
      )}
    </View>
  );
}

function StatChip({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <View style={styles.chip}>
      <Feather name={icon as any} size={14} color={color} />
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { routes } = useRouteContext();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sortedRoutes = React.useMemo(
    () => [...routes].sort((a, b) => b.date.localeCompare(a.date)),
    [routes]
  );

  const routesWithStops = sortedRoutes.filter((r) => r.stops.length > 0);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: topPad + 16 }]}>
      <Text style={styles.heroTitle}>Historia</Text>
      <Text style={styles.subtitle}>Twoje poprzednie trasy</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Feather name="calendar" size={40} color={C.textTertiary} />
      <Text style={styles.emptyTitle}>Brak historii</Text>
      <Text style={styles.emptySubtitle}>Tu pojawią się trasy z poprzednich dni</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={routesWithStops}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <HistoryDayCard route={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!routesWithStops.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  header: {
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dateStr: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  todayBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayText: {
    fontSize: 11,
    color: C.accent,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  pctBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pctText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.backgroundTertiary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  chipValue: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  chipLabel: {
    fontSize: 10,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    height: 5,
    borderRadius: 3,
    flexDirection: "row",
    backgroundColor: C.backgroundTertiary,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    borderRadius: 3,
  },
  progressEmpty: {
    backgroundColor: "#E2E8F0",
  },
  stopPreview: {
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stopName: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
  stopNameVisited: {
    color: C.textTertiary,
    textDecorationLine: "line-through",
  },
  moreStops: {
    fontSize: 12,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    marginLeft: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
