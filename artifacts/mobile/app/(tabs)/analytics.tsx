import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useClientsContext } from "@/context/ClientsContext";
import { useRouteContext } from "@/context/RouteContext";

const C = Colors.light;
const DAY_NAMES = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  gradient: [string, string];
}
function KpiCard({ icon, label, value, sub, gradient }: KpiCardProps) {
  return (
    <LinearGradient colors={gradient} style={styles.kpiCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.kpiIconBox}>
        <Feather name={icon as any} size={20} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </LinearGradient>
  );
}

function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Feather name={icon as any} size={14} color={C.accent} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {badge ? <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>{badge}</Text></View> : null}
    </View>
  );
}

function WeekBar({ day, visits, maxVisits, isToday }: { day: string; visits: number; maxVisits: number; isToday: boolean }) {
  const h = maxVisits > 0 ? Math.max(6, (visits / maxVisits) * 88) : 6;
  return (
    <View style={styles.barCol}>
      {visits > 0 && <Text style={[styles.barValue, isToday && { color: C.accent }]}>{visits}</Text>}
      <View style={styles.barTrack}>
        {visits > 0
          ? <LinearGradient colors={isToday ? [C.accent, C.accentDark] : ["#93C5FD", "#60A5FA"]} style={[styles.barFill, { height: h }]} />
          : <View style={[styles.barFill, { height: 6, backgroundColor: C.backgroundTertiary }]} />}
      </View>
      <Text style={[styles.barDay, isToday && styles.barDayToday]}>{day}</Text>
      {isToday && <View style={styles.todayDot} />}
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
    return { total, visited, planned: total - visited, rate: total > 0 ? Math.round((visited / total) * 100) : 0 };
  }, [todayRoute]);

  const todayRevenue = useMemo(() => orders.filter((o) => o.date.startsWith(today) && o.status !== "cancelled").reduce((s, o) => s + o.total, 0), [orders, today]);

  const weekData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const route = routes.find((r) => r.date === dateStr);
      const visits = route ? route.stops.filter((s) => s.status === "visited").length : 0;
      const revenue = orders.filter((o) => o.date.startsWith(dateStr) && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
      return { dateStr, dayName: DAY_NAMES[d.getDay()], visits, revenue, isToday: dateStr === today };
    });
  }, [routes, orders, today]);

  const weekVisits = weekData.reduce((s, d) => s + d.visits, 0);
  const weekRevenue = weekData.reduce((s, d) => s + d.revenue, 0);
  const maxVisits = Math.max(...weekData.map((d) => d.visits), 1);

  const monthStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthRoutes = routes.filter((r) => r.date >= monthStart);
    const totalVisits = monthRoutes.flatMap((r) => r.stops).filter((s) => s.status === "visited").length;
    const daysWorked = new Set(monthRoutes.filter((r) => r.stops.length > 0).map((r) => r.date)).size;
    return { totalVisits, daysWorked, avgPerDay: daysWorked > 0 ? (totalVisits / daysWorked).toFixed(1) : "0" };
  }, [routes]);

  const monthRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return orders.filter((o) => o.date >= monthStart && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  }, [orders]);

  const topClients = useMemo(() =>
    clients.map((c) => {
      const cOrders = orders.filter((o) => o.clientId === c.id && o.status !== "cancelled");
      const revenue = cOrders.reduce((s, o) => s + o.total, 0);
      const visitCount = routes.flatMap((r) => r.stops).filter((s) => (s as any).clientId === c.id && s.status === "visited").length;
      return { client: c, revenue, orderCount: cOrders.length, visitCount };
    }).filter(x => x.revenue > 0 || x.visitCount > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    [clients, orders, routes]
  );

  const allTimeVisits = useMemo(() => routes.flatMap((r) => r.stops).filter((s) => s.status === "visited").length, [routes]);
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k zł` : `${n.toLocaleString("pl-PL")} zł`;

  const sections = [{ key: "header" }, { key: "today" }, { key: "week" }, { key: "month" }, { key: "clients" }];

  const renderSection = ({ item }: { item: { key: string } }) => {
    if (item.key === "header") return (
      <LinearGradient colors={["#0F1D3D", "#162950", "#1E3A5F"]} style={[styles.heroCard, { paddingTop: topPad + 20 }]}>
        <Text style={styles.heroLabel}>ANALITYKA SPRZEDAŻY</Text>
        <Text style={styles.heroTitle}>Raporty</Text>
        <View style={styles.heroKpiRow}>
          <View style={styles.heroKpi}>
            <Text style={styles.heroKpiNum}>{allTimeVisits}</Text>
            <Text style={styles.heroKpiLabel}>wizyt łącznie</Text>
          </View>
          <View style={styles.heroKpiDivider} />
          <View style={styles.heroKpi}>
            <Text style={styles.heroKpiNum}>{clients.length}</Text>
            <Text style={styles.heroKpiLabel}>klientów CRM</Text>
          </View>
          <View style={styles.heroKpiDivider} />
          <View style={styles.heroKpi}>
            <Text style={[styles.heroKpiNum, { color: "#C4B5FD" }]}>{monthRevenue > 0 ? fmt(monthRevenue) : "—"}</Text>
            <Text style={styles.heroKpiLabel}>przychód (mies.)</Text>
          </View>
        </View>
      </LinearGradient>
    );

    if (item.key === "today") return (
      <View style={styles.section}>
        <SectionHeader icon="sun" title="Dzisiejszy dzień" />
        <View style={styles.kpiGrid}>
          <KpiCard icon="users" label="Klientów" value={`${todayStats.total}`} sub="zaplanowanych" gradient={["#1E40AF", "#2563EB"]} />
          <KpiCard icon="check-circle" label="Odwiedzone" value={`${todayStats.visited}`} sub={`${todayStats.rate}% ukończone`} gradient={["#065F46", "#10B981"]} />
          <KpiCard icon="shopping-bag" label="Zamówienia" value={todayRevenue > 0 ? fmt(todayRevenue) : "—"} gradient={["#5B21B6", "#8B5CF6"]} />
          <KpiCard icon="clock" label="Pozostałe" value={`${todayStats.planned}`} gradient={["#92400E", "#F59E0B"]} />
        </View>
      </View>
    );

    if (item.key === "week") return (
      <View style={styles.section}>
        <SectionHeader
          icon="calendar"
          title="Ostatnie 7 dni"
          badge={weekVisits > 0 ? `${weekVisits} wizyt${weekRevenue > 0 ? ` · ${fmt(weekRevenue)}` : ""}` : undefined}
        />
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Wizyty u klientów</Text>
          <View style={styles.barsRow}>
            {weekData.map((d) => (
              <WeekBar key={d.dateStr} day={d.dayName} visits={d.visits} maxVisits={maxVisits} isToday={d.isToday} />
            ))}
          </View>
        </View>
      </View>
    );

    if (item.key === "month") return (
      <View style={styles.section}>
        <SectionHeader icon="trending-up" title="Ten miesiąc" />
        <View style={styles.kpiGrid}>
          <KpiCard icon="check-circle" label="Wizyty" value={`${monthStats.totalVisits}`} sub={`${monthStats.daysWorked} dni pracy`} gradient={["#065F46", "#10B981"]} />
          <KpiCard icon="activity" label="Śr./dzień" value={`${monthStats.avgPerDay}`} sub="wizyt dziennie" gradient={["#1E40AF", "#3B82F6"]} />
          <KpiCard icon="shopping-bag" label="Przychód" value={monthRevenue > 0 ? fmt(monthRevenue) : "—"} gradient={["#5B21B6", "#8B5CF6"]} />
          <KpiCard icon="users" label="Klienci" value={`${clients.length}`} sub="w CRM" gradient={["#0C4A6E", "#0891B2"]} />
        </View>
      </View>
    );

    if (item.key === "clients") return (
      <View style={styles.section}>
        <SectionHeader icon="star" title="Top klienci wg przychodu" />
        {topClients.length === 0 ? (
          <View style={styles.emptyChart}>
            <Feather name="bar-chart" size={32} color={C.textTertiary} />
            <Text style={styles.emptyChartTitle}>Brak danych</Text>
            <Text style={styles.emptyChartText}>Dodaj klientów i zamówienia, aby zobaczyć ranking</Text>
          </View>
        ) : (
          <View style={styles.rankCard}>
            {topClients.map((item, i) => {
              const maxRev = topClients[0].revenue;
              const pct = maxRev > 0 ? Math.max(5, (item.revenue / maxRev) * 100) : 5;
              return (
                <View key={item.client.id} style={[styles.rankRow, i < topClients.length - 1 && styles.rankRowBorder]}>
                  <View style={[styles.rankNum, i < 3 && { backgroundColor: ["#FEF3C7", "#F1F5F9", "#FEE2E2"][i] }]}>
                    <Text style={[styles.rankNumText, i < 3 && { color: ["#D97706", "#64748B", "#DC2626"][i] }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.rankContent}>
                    <View style={styles.rankTopRow}>
                      <Text style={styles.rankName} numberOfLines={1}>{item.client.name}</Text>
                      <Text style={[styles.rankRevenue, !item.revenue && { color: C.textTertiary }]}>
                        {item.revenue > 0 ? fmt(item.revenue) : "—"}
                      </Text>
                    </View>
                    {item.revenue > 0 && (
                      <View style={styles.rankBarTrack}>
                        <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={[styles.rankBarFill, { width: `${pct}%` as any }]} />
                      </View>
                    )}
                    <Text style={styles.rankSubText}>{item.orderCount} zamówień · {item.visitCount} wizyt</Text>
                  </View>
                </View>
              );
            })}
          </View>
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
        contentContainerStyle={[{ paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  heroCard: { paddingHorizontal: 20, paddingBottom: 24 },
  heroLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold", marginBottom: 18 },
  heroKpiRow: { flexDirection: "row", alignItems: "center" },
  heroKpi: { flex: 1, alignItems: "center" },
  heroKpiNum: { fontSize: 18, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  heroKpiLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 },
  heroKpiDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.12)" },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", flex: 1 },
  sectionBadge: { backgroundColor: C.backgroundTertiary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  sectionBadgeText: { fontSize: 11, color: C.textSecondary, fontFamily: "Inter_600SemiBold" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    flex: 1, minWidth: "45%", borderRadius: 16, padding: 16, gap: 4,
    shadowColor: "rgba(15,23,42,0.15)", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 4,
  },
  kpiIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  kpiValue: { fontSize: 24, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  kpiLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.3 },
  kpiSub: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginTop: 2 },
  chartCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  chartTitle: { fontSize: 13, fontWeight: "600", color: C.textSecondary, fontFamily: "Inter_600SemiBold", marginBottom: 20, textTransform: "uppercase", letterSpacing: 0.5 },
  barsRow: { flexDirection: "row", alignItems: "flex-end" },
  barCol: { flex: 1, alignItems: "center", gap: 5 },
  barValue: { fontSize: 12, fontWeight: "700", color: "#60A5FA", fontFamily: "Inter_700Bold" },
  barTrack: { height: 88, justifyContent: "flex-end" },
  barFill: { width: 22, borderRadius: 6 },
  barDay: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_500Medium" },
  barDayToday: { color: C.accent, fontFamily: "Inter_700Bold" },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  rankCard: {
    backgroundColor: C.surface, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderLight },
  rankNum: { width: 28, height: 28, borderRadius: 9, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rankNumText: { fontSize: 12, fontWeight: "700", color: C.textSecondary, fontFamily: "Inter_700Bold" },
  rankContent: { flex: 1, gap: 5 },
  rankTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rankName: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", flex: 1 },
  rankRevenue: { fontSize: 14, fontWeight: "700", color: "#8B5CF6", fontFamily: "Inter_700Bold" },
  rankBarTrack: { height: 5, backgroundColor: C.backgroundTertiary, borderRadius: 3, overflow: "hidden" },
  rankBarFill: { height: 5, borderRadius: 3 },
  rankSubText: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  emptyChart: { backgroundColor: C.surface, borderRadius: 18, padding: 40, alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.border },
  emptyChartTitle: { fontSize: 16, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  emptyChartText: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center" },
});
