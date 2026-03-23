import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useClientsContext, type Client, type PaymentStatus } from "@/context/ClientsContext";
import { useRouteContext } from "@/context/RouteContext";
import { AddClientModal } from "@/components/AddClientModal";
import { ClientDetailModal } from "@/components/ClientDetailModal";

const C = Colors.light;
type SortBy = "name" | "priority" | "recent";

const PRIORITY_CONFIG = {
  high:   { color: "#EF4444", bg: "#FEE2E2", label: "Wysoki",  gradient: ["#EF4444", "#DC2626"] as [string,string] },
  medium: { color: "#F59E0B", bg: "#FEF3C7", label: "Średni",  gradient: ["#F59E0B", "#D97706"] as [string,string] },
  low:    { color: "#10B981", bg: "#D1FAE5", label: "Niski",   gradient: ["#10B981", "#059669"] as [string,string] },
};

const PAYMENT_CONFIG: Record<PaymentStatus, { color: string; label: string; icon: string; bg: string }> = {
  ok:       { color: C.success,  bg: "#D1FAE5", label: "OK",        icon: "check-circle" },
  overdue:  { color: C.warning,  bg: "#FEF3C7", label: "Zaległość", icon: "alert-circle"  },
  critical: { color: C.danger,   bg: "#FEE2E2", label: "Krytyczny", icon: "x-circle"      },
};

const AVATAR_COLORS: [string, string][] = [
  ["#2563EB", "#1D4ED8"],
  ["#7C3AED", "#6D28D9"],
  ["#0891B2", "#0E7490"],
  ["#059669", "#047857"],
  ["#D97706", "#B45309"],
  ["#DC2626", "#B91C1C"],
  ["#9333EA", "#7E22CE"],
];

function getAvatarColors(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function ClientCard({ client, onPress }: { client: Client; onPress: () => void }) {
  const { getClientOrders, getPaymentStatus } = useClientsContext();
  const { routes } = useRouteContext();
  const pConfig = PRIORITY_CONFIG[client.priority];
  const payStatus = getPaymentStatus(client);
  const payConfig = PAYMENT_CONFIG[payStatus];
  const clientOrders = getClientOrders(client.id);
  const avatarColors = getAvatarColors(client.name);

  const visitCount = useMemo(() =>
    routes.flatMap((r) => r.stops).filter((s) => (s as any).clientId === client.id && s.status === "visited").length,
    [routes, client.id]
  );
  const orderTotal = clientOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  const handleCall = async (e: any) => {
    e.stopPropagation();
    if (!client.phone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${client.phone.replace(/\s/g, "")}`);
  };

  const handleEmail = async (e: any) => {
    e.stopPropagation();
    if (!client.email) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${client.email}`);
  };

  return (
    <Pressable style={({ pressed }) => [styles.card, { opacity: pressed ? 0.94 : 1 }]} onPress={onPress}>
      <View style={styles.cardInner}>
        <LinearGradient colors={avatarColors} style={styles.avatar}>
          <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
        </LinearGradient>

        <View style={styles.clientBody}>
          <View style={styles.clientTopRow}>
            <View style={styles.clientNameBlock}>
              <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
              {client.company && <Text style={styles.clientCompany} numberOfLines={1}>{client.company}</Text>}
            </View>
            <View style={styles.badges}>
              <View style={[styles.priorityBadge, { backgroundColor: pConfig.bg }]}>
                <Text style={[styles.priorityBadgeText, { color: pConfig.color }]}>{pConfig.label}</Text>
              </View>
              <View style={[styles.payBadge, { backgroundColor: payConfig.bg }]}>
                <Feather name={payConfig.icon as any} size={10} color={payConfig.color} />
              </View>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Feather name="map-pin" size={11} color={C.textTertiary} />
            <Text style={styles.address} numberOfLines={1}>{client.address}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Feather name="check-circle" size={11} color={C.success} />
              <Text style={styles.statChipText}>{visitCount} wizyt</Text>
            </View>
            {orderTotal > 0 ? (
              <View style={styles.statChip}>
                <Feather name="shopping-bag" size={11} color="#8B5CF6" />
                <Text style={[styles.statChipText, { color: "#8B5CF6", fontFamily: "Inter_600SemiBold" }]}>
                  {orderTotal.toLocaleString("pl-PL")} zł
                </Text>
              </View>
            ) : null}
            {client.discount > 0 && (
              <View style={styles.statChip}>
                <Feather name="tag" size={11} color={C.accent} />
                <Text style={styles.statChipText}>-{client.discount}%</Text>
              </View>
            )}
          </View>

          {client.currentDebt && client.currentDebt > 0 ? (
            <View style={styles.debtRow}>
              <Feather name="alert-triangle" size={11} color={C.warning} />
              <Text style={styles.debtText}>Zaległość: <Text style={styles.debtVal}>{client.currentDebt.toLocaleString("pl-PL")} zł</Text></Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardFooter}>
        {client.phone && (
          <Pressable style={styles.footerBtn} onPress={handleCall}>
            <Feather name="phone" size={13} color={C.success} />
            <Text style={[styles.footerBtnText, { color: C.success }]}>{client.phone}</Text>
          </Pressable>
        )}
        {client.email && (
          <Pressable style={[styles.footerBtn, styles.emailBtn]} onPress={handleEmail}>
            <Feather name="mail" size={13} color={C.accent} />
            <Text style={[styles.footerBtnText, { color: C.accent }]} numberOfLines={1}>{client.email}</Text>
          </Pressable>
        )}
        <View style={styles.arrowBtn}>
          <Feather name="chevron-right" size={16} color={C.textTertiary} />
        </View>
      </View>
    </Pressable>
  );
}

export default function ClientsScreen() {
  const { clients } = useClientsContext();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [addVisible, setAddVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    let list = [...clients];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      );
    }
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    else if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      list.sort((a, b) => order[a.priority] - order[b.priority]);
    } else {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return list;
  }, [clients, search, sortBy]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ClientCard client={item} onPress={() => setSelectedClient(item)} />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={["#0F1D3D", "#162950", "#1E3A5F"]} style={[styles.heroCard, { paddingTop: topPad + 20 }]}>
              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroLabel}>BAZA KLIENTÓW</Text>
                  <Text style={styles.heroTitle}>Klienci</Text>
                  <Text style={styles.heroSub}>{clients.length} kontrahentów w CRM</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => setAddVisible(true)}
                >
                  <Feather name="user-plus" size={15} color="#fff" />
                  <Text style={styles.addBtnText}>Dodaj</Text>
                </Pressable>
              </View>
            </LinearGradient>

            <View style={styles.searchSection}>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color={C.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Szukaj klienta, firmy, telefonu..."
                  placeholderTextColor={C.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search ? (
                  <Pressable onPress={() => setSearch("")} hitSlop={8}>
                    <Feather name="x-circle" size={16} color={C.textTertiary} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sortuj:</Text>
                {([["name", "A–Z"], ["priority", "Priorytet"], ["recent", "Nowi"]] as [SortBy, string][]).map(([v, l]) => (
                  <Pressable
                    key={v}
                    style={[styles.sortChip, sortBy === v && styles.sortChipActive]}
                    onPress={async () => { await Haptics.selectionAsync(); setSortBy(v); }}
                  >
                    <Text style={[styles.sortText, sortBy === v && styles.sortTextActive]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {filtered.length === 0 && clients.length > 0 && (
              <View style={styles.noResults}>
                <Feather name="search" size={22} color={C.textTertiary} />
                <Text style={styles.noResultsText}>Brak wyników dla "{search}"</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          clients.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyRing2}>
                <View style={styles.emptyRing1}>
                  <View style={styles.emptyIconCenter}>
                    <Feather name="users" size={28} color="#fff" />
                  </View>
                </View>
              </View>
              <Text style={styles.emptyTitle}>Baza klientów jest pusta</Text>
              <Text style={styles.emptySub}>Dodaj pierwszego kontrahenta i miej jego dane, historię wizyt i zamówienia zawsze pod ręką.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setAddVisible(true)}>
                <Feather name="user-plus" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Dodaj pierwszego klienta</Text>
              </Pressable>
            </View>
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      />

      <AddClientModal visible={addVisible} onClose={() => setAddVisible(false)} />
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          visible={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdated={(updated) => setSelectedClient(updated)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  listContent: {},
  heroCard: { paddingHorizontal: 20, paddingBottom: 24 },
  heroRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginTop: 3 },
  addBtn: {
    backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  searchSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.text, fontFamily: "Inter_400Regular" },
  sortRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sortLabel: { fontSize: 12, color: C.textTertiary, fontFamily: "Inter_500Medium" },
  sortChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  sortChipActive: { backgroundColor: "#DBEAFE", borderColor: C.accent },
  sortText: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  sortTextActive: { color: C.accent, fontFamily: "Inter_600SemiBold" },
  noResults: { alignItems: "center", gap: 8, paddingTop: 40 },
  noResultsText: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  cardWrapper: { paddingHorizontal: 16, paddingBottom: 0 },
  card: {
    backgroundColor: C.surface, borderRadius: 18, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3,
  },
  cardInner: { flexDirection: "row", gap: 14, padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  clientBody: { flex: 1, gap: 6 },
  clientTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  clientNameBlock: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  clientCompany: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  badges: { flexDirection: "row", gap: 5, flexShrink: 0 },
  priorityBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  priorityBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  payBadge: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { fontSize: 12, color: C.textTertiary, flex: 1, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  statChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.background, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  statChipText: { fontSize: 11, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  debtRow: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FFFBEB", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  debtText: { fontSize: 11, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  debtVal: { fontFamily: "Inter_600SemiBold", color: C.warning },
  cardFooter: {
    flexDirection: "row", gap: 0, borderTopWidth: 1, borderTopColor: C.borderLight,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  footerBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ECFDF5", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, marginRight: 6 },
  emailBtn: { backgroundColor: "#EFF6FF" },
  footerBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  arrowBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: C.background, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 28, gap: 0 },
  emptyRing2: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  emptyRing1: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#BFDBFE", alignItems: "center", justifyContent: "center" },
  emptyIconCenter: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  emptySub: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  emptyBtn: {
    backgroundColor: C.accent, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 24,
    flexDirection: "row", alignItems: "center", gap: 8,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  emptyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
