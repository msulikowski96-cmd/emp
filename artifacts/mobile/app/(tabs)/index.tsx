import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
import { RouteMapView } from "@/components/MapView";
import { NextStopBanner } from "@/components/NextStopBanner";
import { useRouteContext, type VisitStatus } from "@/context/RouteContext";

const C = Colors.light;
type Filter = "all" | "planned" | "active" | "visited";

const FILTER_OPTIONS: { value: Filter; label: string; icon: string }[] = [
  { value: "all",     label: "Wszystkie",  icon: "list"         },
  { value: "planned", label: "Plan",       icon: "clock"        },
  { value: "active",  label: "W trakcie",  icon: "navigation"   },
  { value: "visited", label: "Gotowe",     icon: "check-circle" },
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
      { text: "Wyczyść", style: "destructive", onPress: async () => { await clearTodayRoute(); } },
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
  const todayCapitalized = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={C.accent} /></View>;
  }

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={["#0F1D3D", "#162950", "#1E3A5F"]}
        style={[styles.heroCard, { paddingTop: topPad + 20 }]}
      >
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroDate}>{todayCapitalized}</Text>
            <Text style={styles.heroTitle}>Dzień pracy</Text>
          </View>
          <View style={styles.heroActions}>
            {sortedStops.length >= 2 && (
              <Pressable style={styles.heroOptBtn} onPress={handleOptimize} disabled={optimizing}>
                {optimizing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Feather name="zap" size={13} color="#FBBF24" /><Text style={styles.heroOptText}>Optymalizuj</Text></>}
              </Pressable>
            )}
            {sortedStops.length > 0 && (
              <Pressable onPress={handleClear} hitSlop={10} style={styles.heroClearBtn}>
                <Feather name="trash-2" size={15} color="rgba(255,255,255,0.5)" />
              </Pressable>
            )}
          </View>
        </View>

        {sortedStops.length > 0 && (
          <View style={styles.heroStats}>
            <HeroStat value={stats.total} label="Klientów" color="#93C5FD" />
            <View style={styles.heroStatDivider} />
            <HeroStat value={stats.visited} label="Odwiedz." color="#6EE7B7" />
            <View style={styles.heroStatDivider} />
            <HeroStat value={stats.active} label="W trakcie" color="#FCD34D" />
            <View style={styles.heroStatDivider} />
            <HeroStat value={`${stats.visitedPct}%`} label="Ukończone" color="#FFFFFF" large />
          </View>
        )}

        {sortedStops.length > 0 && (
          <View style={styles.heroProgressOuter}>
            <View style={[styles.heroProgressFill, { flex: stats.visited || 0.001 }]} />
            <View style={{ flex: stats.total - stats.visited || 0.001, backgroundColor: "rgba(255,255,255,0.12)" }} />
          </View>
        )}

        {sortedStops.length === 0 && (
          <Text style={styles.heroEmpty}>Dodaj punkty, aby zaplanować dzień</Text>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {nextStop && (
          <NextStopBanner stop={nextStop} onStartVisit={() => updateStopStatus(nextStop.id, "active")} />
        )}

        {sortedStops.length > 0 && <RouteMapView stops={sortedStops} />}

        {todayRoute?.isOptimized && sortedStops.length > 0 && (
          <View style={styles.optimizedBadge}>
            <Feather name="zap" size={11} color={C.success} />
            <Text style={styles.optimizedText}>Trasa zoptymalizowana</Text>
          </View>
        )}

        {sortedStops.length > 0 && (
          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map((f) => {
              const count = f.value === "all" ? sortedStops.length : sortedStops.filter((s) => s.status === f.value).length;
              const isActive = filter === f.value;
              return (
                <Pressable
                  key={f.value}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={async () => { await Haptics.selectionAsync(); setFilter(f.value); }}
                >
                  <Feather name={f.icon as any} size={12} color={isActive ? C.accent : C.textTertiary} />
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f.label}</Text>
                  {count > 0 && (
                    <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                      <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>{count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {filteredStops.length > 0 && (
          <Text style={styles.sectionLabel}>
            {filter === "all" ? "PUNKTY TRASY" : FILTER_OPTIONS.find(f => f.value === filter)?.label.toUpperCase()}
            {" · "}
            {filteredStops.length}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyRing2}>
        <View style={styles.emptyRing1}>
          <View style={styles.emptyIconCenter}>
            <Feather name="map-pin" size={28} color={C.accent} />
          </View>
        </View>
      </View>
      <Text style={styles.emptyTitle}>Zacznij planować dzień</Text>
      <Text style={styles.emptySubtitle}>Dodaj klientów, których chcesz odwiedzić – ułożymy optymalną trasę i zaoszczędzisz czas na jeździe.</Text>
      <Pressable
        style={({ pressed }) => [styles.addFirstBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => router.push("/add-stop")}
      >
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
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <StopCard
              stop={item}
              index={sortedStops.indexOf(item)}
              onStatusChange={updateStopStatus}
              onVisitReport={markVisitedWithReport}
              onDelete={removeStop}
              showOrder
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={filteredStops.length === 0 && filter === "all" ? renderEmpty : null}
        contentContainerStyle={[styles.listContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
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
          style={({ pressed }) => [styles.fabBtn, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/add-stop"); }}
        >
          <Feather name="plus" size={26} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function HeroStat({ value, label, color, large }: { value: number | string; label: string; color: string; large?: boolean }) {
  return (
    <View style={styles.heroStatItem}>
      <Text style={[styles.heroStatNum, large && styles.heroStatNumLarge, { color }]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.background },
  heroCard: { paddingHorizontal: 20, paddingBottom: 24 },
  heroTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  heroDate: { fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", letterSpacing: 0.5, textTransform: "uppercase" },
  heroTitle: { fontSize: 26, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", marginTop: 3 },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  heroOptBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  heroOptText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  heroClearBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  heroStats: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  heroStatNumLarge: { fontSize: 26 },
  heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.12)" },
  heroProgressOuter: { height: 5, flexDirection: "row", overflow: "hidden", borderRadius: 99 },
  heroProgressFill: { backgroundColor: "#34D399" },
  heroEmpty: { fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  cardWrapper: { paddingHorizontal: 16 },
  listContent: {},
  optimizedBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 12 },
  optimizedText: { fontSize: 12, color: C.success, fontFamily: "Inter_500Medium" },
  filterRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  filterChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 9, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: "#EFF6FF", borderColor: C.accent },
  filterText: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: C.accent, fontFamily: "Inter_600SemiBold" },
  filterBadge: { backgroundColor: C.backgroundTertiary, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1, minWidth: 16, alignItems: "center" },
  filterBadgeActive: { backgroundColor: C.accent },
  filterBadgeText: { fontSize: 9, color: C.textSecondary, fontFamily: "Inter_700Bold" },
  filterBadgeTextActive: { color: "#fff" },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.textTertiary, fontFamily: "Inter_700Bold", marginBottom: 10, letterSpacing: 0.8, textTransform: "uppercase" },
  emptyState: { alignItems: "center", paddingTop: 28, paddingHorizontal: 28, gap: 0 },
  emptyRing2: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  emptyRing1: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#BFDBFE", alignItems: "center", justifyContent: "center" },
  emptyIconCenter: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  addFirstBtn: {
    backgroundColor: C.accent, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 28,
    flexDirection: "row", alignItems: "center", gap: 8,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  addFirstBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  fab: { position: "absolute", right: 20 },
  fabBtn: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
});
