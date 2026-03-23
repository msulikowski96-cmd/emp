import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { StopCard } from "@/components/StopCard";
import { StatsBar } from "@/components/StatsBar";
import { RouteMapView } from "@/components/MapView";
import { NextStopBanner } from "@/components/NextStopBanner";
import { useRouteContext, type VisitStatus } from "@/context/RouteContext";

const C = Colors.light;
type Filter = "all" | "planned" | "active" | "visited";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "planned", label: "Zaplanowane" },
  { value: "active", label: "W trakcie" },
  { value: "visited", label: "Odwiedzone" },
];

export default function HomeScreen() {
  const { todayRoute, loading, stats, nextStop, updateStopStatus, markVisitedWithReport, removeStop, optimizeRoute, clearTodayRoute } = useRouteContext();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleOptimize = async () => {
    if (!todayRoute || todayRoute.stops.length < 2) return;
    setOptimizing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await optimizeRoute();
    setOptimizing(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClear = () => {
    Alert.alert("Wyczyść trasę", "Usunąć wszystkie punkty z dzisiejszej trasy?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Wyczyść", style: "destructive",
        onPress: async () => { await clearTodayRoute(); await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); },
      },
    ]);
  };

  const sortedStops = React.useMemo(() => {
    if (!todayRoute) return [];
    return [...todayRoute.stops].sort((a, b) => a.order - b.order);
  }, [todayRoute]);

  const filteredStops = React.useMemo(() => {
    if (filter === "all") return sortedStops;
    return sortedStops.filter((s) => s.status === filter);
  }, [sortedStops, filter]);

  const todayStr = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={C.accent} /></View>;
  }

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={styles.dateText}>{todayStr}</Text>
          <Text style={styles.heroTitle}>Moja trasa</Text>
        </View>
        <View style={styles.headerActions}>
          {sortedStops.length >= 2 && (
            <Pressable style={({ pressed }) => [styles.optimizeBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleOptimize} disabled={optimizing}>
              {optimizing
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Feather name="zap" size={14} color="#fff" /><Text style={styles.optimizeBtnText}>Optymalizuj</Text></>}
            </Pressable>
          )}
          {sortedStops.length > 0 && (
            <Pressable style={({ pressed }) => [styles.clearBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={handleClear} hitSlop={8}>
              <Feather name="trash-2" size={16} color={C.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {sortedStops.length > 0 && <StatsBar {...stats} />}

      {nextStop && (
        <NextStopBanner
          stop={nextStop}
          onStartVisit={() => updateStopStatus(nextStop.id, "active")}
        />
      )}

      {sortedStops.length > 0 && <RouteMapView stops={sortedStops} />}

      {todayRoute?.isOptimized && sortedStops.length > 0 && (
        <View style={styles.optimizedBadge}>
          <Feather name="zap" size={12} color={C.success} />
          <Text style={styles.optimizedText}>Trasa zoptymalizowana według priorytetu</Text>
        </View>
      )}

      {sortedStops.length > 0 && (
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((f) => {
            const count = f.value === "all" ? sortedStops.length : sortedStops.filter((s) => s.status === f.value).length;
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={async () => { await Haptics.selectionAsync(); setFilter(f.value); }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
                {count > 0 && <View style={[styles.filterBadge, active && styles.filterBadgeActive]}><Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{count}</Text></View>}
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionTitle}>
        {filteredStops.length === 0 && filter !== "all"
          ? `Brak punktów (${FILTER_OPTIONS.find(f => f.value === filter)?.label})`
          : filteredStops.length === 0 ? "Punkty trasy" : `Punkty (${filteredStops.length})`}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Feather name="map-pin" size={32} color={C.accent} /></View>
      <Text style={styles.emptyTitle}>Zacznij planować trasę</Text>
      <Text style={styles.emptySubtitle}>Dodaj klientów, których chcesz odwiedzić dzisiaj – ułożymy optymalną trasę.</Text>
      <Pressable style={({ pressed }) => [styles.addFirstBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={() => router.push("/add-stop")}>
        <Feather name="plus" size={18} color="#fff" />
        <Text style={styles.addFirstBtnText}>Dodaj pierwszego klienta</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredStops}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <StopCard
            stop={item}
            index={sortedStops.indexOf(item)}
            onStatusChange={updateStopStatus}
            onVisitReport={markVisitedWithReport}
            onDelete={removeStop}
            showOrder
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={filteredStops.length === 0 && filter === "all" ? renderEmpty : null}
        contentContainerStyle={[styles.listContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await new Promise((r) => setTimeout(r, 500)); setRefreshing(false); }}
            tintColor={C.accent}
          />
        }
      />

      <View style={[styles.fab, { bottom: botPad + 90 }]}>
        <Pressable
          style={({ pressed }) => [styles.fabBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/add-stop"); }}
        >
          <Feather name="plus" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.background },
  listContent: { paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 14 },
  dateText: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular", textTransform: "capitalize", marginBottom: 2 },
  heroTitle: { fontSize: 28, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  optimizeBtn: {
    backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: "row", alignItems: "center", gap: 5,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2,
  },
  optimizeBtnText: { color: "#fff", fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  clearBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  optimizedBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10, paddingHorizontal: 2 },
  optimizedText: { fontSize: 12, color: C.success, fontFamily: "Inter_500Medium" },
  filterRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: "#EFF6FF", borderColor: C.accent },
  filterText: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: C.accent, fontFamily: "Inter_600SemiBold" },
  filterBadge: { backgroundColor: C.backgroundTertiary, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeActive: { backgroundColor: C.accent },
  filterBadgeText: { fontSize: 10, color: C.textSecondary, fontFamily: "Inter_700Bold" },
  filterBadgeTextActive: { color: "#fff" },
  sectionTitle: { fontSize: 12, fontWeight: "600", color: C.textTertiary, fontFamily: "Inter_600SemiBold", marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  emptyState: { alignItems: "center", paddingTop: 32, paddingHorizontal: 24, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  addFirstBtn: {
    backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  addFirstBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  fab: { position: "absolute", right: 20 },
  fabBtn: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
});
