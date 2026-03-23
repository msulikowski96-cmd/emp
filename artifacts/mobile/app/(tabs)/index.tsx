import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useRouteContext, type RouteStop, type VisitStatus } from "@/context/RouteContext";

const C = Colors.light;

export default function HomeScreen() {
  const { todayRoute, loading, stats, updateStopStatus, removeStop, optimizeRoute, clearTodayRoute } = useRouteContext();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleOptimize = async () => {
    if (!todayRoute || todayRoute.stops.length < 2) return;
    setOptimizing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await optimizeRoute();
    setOptimizing(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClear = () => {
    Alert.alert(
      "Wyczyść trasę",
      "Usunąć wszystkie punkty z dzisiejszej trasy?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Wyczyść",
          style: "destructive",
          onPress: async () => {
            await clearTodayRoute();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const sortedStops = React.useMemo(() => {
    if (!todayRoute) return [];
    return [...todayRoute.stops].sort((a, b) => a.order - b.order);
  }, [todayRoute]);

  const activeStops = sortedStops.filter((s) => s.status !== "visited");

  const todayStr = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
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
            <Pressable
              style={({ pressed }) => [styles.optimizeBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="zap" size={14} color="#fff" />
                  <Text style={styles.optimizeBtnText}>Optymalizuj</Text>
                </>
              )}
            </Pressable>
          )}
          {sortedStops.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.clearBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleClear}
              hitSlop={8}
            >
              <Feather name="trash-2" size={16} color={C.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {sortedStops.length > 0 && (
        <View style={styles.statsSection}>
          <StatsBar {...stats} />
        </View>
      )}

      {sortedStops.length > 0 && (
        <View style={styles.mapSection}>
          <RouteMapView stops={sortedStops} />
        </View>
      )}

      {todayRoute?.isOptimized && sortedStops.length > 0 && (
        <View style={styles.optimizedBadge}>
          <Feather name="zap" size={12} color={C.success} />
          <Text style={styles.optimizedText}>Trasa zoptymalizowana</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        {sortedStops.length === 0 ? "Punkty trasy" : `Punkty (${sortedStops.length})`}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="map-pin" size={32} color={C.accent} />
      </View>
      <Text style={styles.emptyTitle}>Zacznij planować trasę</Text>
      <Text style={styles.emptySubtitle}>
        Dodaj punkty, które chcesz odwiedzić dzisiaj, a my ułożymy optymalną trasę.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.addFirstBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => router.push("/add-stop")}
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={styles.addFirstBtnText}>Dodaj pierwszy punkt</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedStops}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <StopCard
            stop={item}
            index={index}
            onStatusChange={updateStopStatus}
            onDelete={removeStop}
            showOrder={true}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!todayRoute}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await new Promise((r) => setTimeout(r, 500));
              setRefreshing(false);
            }}
            tintColor={C.accent}
          />
        }
      />

      <View style={[styles.fab, { bottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }]}>
        <Pressable
          style={({ pressed }) => [styles.fabBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/add-stop");
          }}
        >
          <Feather name="plus" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  optimizeBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  optimizeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsSection: {
    marginBottom: 4,
  },
  mapSection: {
    marginBottom: 4,
  },
  optimizedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  optimizedText: {
    fontSize: 12,
    color: C.success,
    fontFamily: "Inter_500Medium",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  addFirstBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  fab: {
    position: "absolute",
    right: 20,
  },
  fabBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});
