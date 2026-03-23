import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useClientsContext } from "@/context/ClientsContext";
import { useRouteContext } from "@/context/RouteContext";

const C = Colors.light;
const DAY_NAMES = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

function KpiCard({ icon, label, value, sub, color, bg }: { icon: string; label: string; value: string; sub?: string; color: string; bg: string }) {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.kpiContent}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
        {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function WeekBar({ day, visits, maxVisits }: { day: string; visits: number; maxVisits: number }) {
  const h = maxVisits > 0 ? Math.max(4, (visits / maxVisits) * 80) : 4;
  return (
    <View style={styles.barCol}>
      <Text style={styles.barValue}>{visits > 0 ? visits : ""}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: h, backgroundColor: visits > 0 ? C.accent : C.border }]} />
      </View>
      <Text style={styles.barDay}>{day}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { routes, todayRoute } = useRouteContext();
  const { clients, orders } = useClientsContext();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const today = new Date().toISOString().split("T")[0];

  const todayStats = useMemo(() => {
    if (!todayRoute) return { total: 0, visited: 0, planned: 0, rate: 0 };
    const total = todayRoute.stops.length;
    const visited = todayRoute.stops.filter((s) => s.status === "visited").length;
    const planned = total - visited;
    const rate = total > 0 ? Math.round((visited / total) * 100) : 0;
    return { total, visited, planned, rate };
  }, [todayRoute]);

  const todayRevenue = useMemo(() => {
    return orders.filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
  }, [orders, today]);

  const weekData = useMemo(() => {
    const now = new Date();
    const days: { date: string; dayName: string; visits: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const route = routes.find((r) => r.date === dateStr);
      const visits = route ? route.stops.filter((s) => s.status === "visited").length : 0;
      const revenue = orders
        .filter((o) => o.date.startsWith(dateStr) && o.status !== "cancelled")
        .reduce((s, o) => s + o.total, 0);
      days.push({ date: dateStr, dayName: DAY_NAMES[d.getDay()], visits, revenue });
    }
    return days;
  }, [routes, orders]);

  const weekVisits = weekData.reduce((s, d) => s + d.visits, 0);
  const weekRevenue = weekData.reduce((s, d) => s + d.revenue, 0);
  const maxVisits = Math.max(...weekData.map((d) => d.visits), 1);

  const monthStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthRoutes = routes.filter((r) => r.date >= monthStart);
    const totalVisits = monthRoutes.flatMap((r) => r.stops).filter((s) => s.status === "visited").length;
    const totalStops = monthRoutes.flatMap((r) => r.stops).length;
    const daysWorked = new Set(monthRoutes.filter((r) => r.stops.length > 0).map((r) => r.date)).size;
    const avgPerDay = daysWorked > 0 ? (totalVisits / daysWorked).toFixed(1) : "0";
    return { totalVisits, totalStops, daysWorked, avgPerDay };
  }, [routes]);

  const monthRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return orders.filter((o) => o.date >= monthStart && o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
  }, [orders]);

  const topClients = useMemo(() => {
    return clients
      .map((c) => {
        const clientOrders = orders.filter((o) => o.clientId === c.id && o.status !== "cancelled");
        const revenue = clientOrders.reduce((s, o) => s + o.total, 0);
        const visitCount = routes.flatMap((r) => r.stops).filter((s) => (s as any).clientId === c.id && s.status === "visited").length;
        return { client: c, revenue, orderCount: clientOrders.length, visitCount };
      })
      .filter((x) => x.revenue > 0 || x.visitCount > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [clients, orders, routes]);

  const allTimeVisits = useMemo(() =>
    routes.flatMap((r) => r.stops).filter((s) => s.status === "visited").length,
    [routes]
  );

  const fmt = (n: number) => n.toLocaleString("pl-PL") + " zł";

  const sections = [
    { key: "header" },
    { key: "today" },
    { key: "week" },
    { key: "month" },
    { key: "clients" },
  ];

  const renderSection = ({ item }: { item: { key: string } }) => {
    if (item.key === "header") return (
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.heroTitle}>Raporty</Text>
        <Text style={styles.heroSub}>Analityka Twojej sprzedaży</Text>
      </View>
    );

    if (item.key === "today") return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="sun" size={14} color={C.statusActive} />
          <Text style={styles.sectionTitle}>Dziś</Text>
        </View>
        <View style={styles.kpiGrid}>
          <KpiCard icon="map-pin" label="Klientów" value={`${todayStats.total}`} sub="zaplanowanych" color="#2563EB" bg="#EFF6FF" />
          <KpiCard icon="check-circle" label="Odwiedzonych" value={`${todayStats.visited}`} sub={`${todayStats.rate}% ukończone`} color={C.success} bg="#ECFDF5" />
          <KpiCard icon="shopping-bag" label="Zamówienia" value={todayRevenue > 0 ? fmt(todayRevenue) : "—"} color="#8B5CF6" bg="#F5F3FF" />
          <KpiCard icon="clock" label="Pozostałe" value={`${todayStats.planned}`} color={C.warning} bg="#FFFBEB" />
        </View>
      </View>
    );

    if (item.key === "week") return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="calendar" size={14} color={C.accent} />
          <Text style={styles.sectionTitle}>Ostatnie 7 dni</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{weekVisits} wizyt · {weekRevenue > 0 ? fmt(weekRevenue) : "brak zamówień"}</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Wizyty u klientów</Text>
          <View style={styles.barsContainer}>
            {weekData.map((d) => (
              <WeekBar key={d.date} day={d.dayName} visits={d.visits} maxVisits={maxVisits} />
            ))}
          </View>
        </View>
      </View>
    );

    if (item.key === "month") return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="trending-up" size={14} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>Ten miesiąc</Text>
        </View>
        <View style={styles.kpiGrid}>
          <KpiCard icon="check-circle" label="Wizyty łącznie" value={`${monthStats.totalVisits}`} sub={`${monthStats.daysWorked} dni roboczych`} color={C.success} bg="#ECFDF5" />
          <KpiCard icon="activity" label="Śr./dzień" value={`${monthStats.avgPerDay}`} sub="wizyt dziennie" color={C.accent} bg="#EFF6FF" />
          <KpiCard icon="shopping-bag" label="Przychód" value={monthRevenue > 0 ? fmt(monthRevenue) : "—"} color="#8B5CF6" bg="#F5F3FF" />
          <KpiCard icon="users" label="Klientów" value={`${clients.length}`} sub="w bazie CRM" color="#0891B2" bg="#ECFEFF" />
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: C.textTertiary, marginTop: 0 }]}>
          <View style={[styles.kpiIcon, { backgroundColor: C.backgroundTertiary }]}>
            <Feather name="bar-chart-2" size={18} color={C.textSecondary} />
          </View>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>Wszystkie wizyty (łącznie)</Text>
            <Text style={[styles.kpiValue, { color: C.text }]}>{allTimeVisits}</Text>
            <Text style={styles.kpiSub}>od początku używania aplikacji</Text>
          </View>
        </View>
      </View>
    );

    if (item.key === "clients") return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="star" size={14} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Top klienci wg przychodu</Text>
        </View>
        {topClients.length === 0 ? (
          <View style={styles.emptyChart}>
            <Feather name="bar-chart" size={28} color={C.textTertiary} />
            <Text style={styles.emptyChartText}>Dodaj klientów i zamówienia, aby zobaczyć ranking</Text>
          </View>
        ) : (
          topClients.map((item, i) => {
            const maxRev = topClients[0].revenue;
            const barW = maxRev > 0 ? `${Math.max(5, (item.revenue / maxRev) * 100)}%` : "5%";
            return (
              <View key={item.client.id} style={styles.clientRankRow}>
                <View style={styles.rankNum}>
                  <Text style={styles.rankNumText}>{i + 1}</Text>
                </View>
                <View style={styles.rankContent}>
                  <View style={styles.rankTop}>
                    <Text style={styles.rankName} numberOfLines={1}>{item.client.name}</Text>
                    <Text style={styles.rankRevenue}>{item.revenue > 0 ? fmt(item.revenue) : "—"}</Text>
                  </View>
                  <View style={styles.rankBarTrack}>
                    <View style={[styles.rankBarFill, { width: barW as any }]} />
                  </View>
                  <View style={styles.rankSub}>
                    <Text style={styles.rankSubText}>{item.orderCount} zamówień · {item.visitCount} wizyt</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    );

    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(s) => s.key}
        renderItem={renderSection}
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
  heroSub: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", flex: 1 },
  sectionBadge: { backgroundColor: C.backgroundTertiary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  sectionBadgeText: { fontSize: 11, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  kpiCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 3,
    flexDirection: "row", alignItems: "center", gap: 12,
    flex: 1, minWidth: "45%",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1,
    marginBottom: 0,
  },
  kpiIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  kpiContent: { flex: 1, gap: 2 },
  kpiLabel: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.3 },
  kpiValue: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  kpiSub: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  chartCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  chartTitle: { fontSize: 13, fontWeight: "600", color: C.textSecondary, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  barsContainer: { flexDirection: "row", alignItems: "flex-end", gap: 0 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barValue: { fontSize: 11, color: C.accent, fontFamily: "Inter_700Bold", height: 16 },
  barTrack: { height: 80, justifyContent: "flex-end" },
  barFill: { width: 20, borderRadius: 5 },
  barDay: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_500Medium" },
  clientRankRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  rankNum: { width: 24, height: 24, borderRadius: 8, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rankNumText: { fontSize: 12, fontWeight: "700", color: C.textSecondary, fontFamily: "Inter_700Bold" },
  rankContent: { flex: 1, gap: 4 },
  rankTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rankName: { fontSize: 13, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", flex: 1 },
  rankRevenue: { fontSize: 13, fontWeight: "700", color: "#8B5CF6", fontFamily: "Inter_700Bold" },
  rankBarTrack: { height: 6, backgroundColor: C.backgroundTertiary, borderRadius: 3, overflow: "hidden" },
  rankBarFill: { height: 6, backgroundColor: "#8B5CF6", borderRadius: 3 },
  rankSub: {},
  rankSubText: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  emptyChart: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyChartText: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center" },
});
