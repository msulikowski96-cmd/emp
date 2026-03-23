import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
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
  high:   { color: "#EF4444", bg: "#FEF2F2", label: "Wysoki" },
  medium: { color: "#F59E0B", bg: "#FFFBEB", label: "Średni" },
  low:    { color: "#10B981", bg: "#ECFDF5", label: "Niski"  },
};

const PAYMENT_CONFIG: Record<PaymentStatus, { color: string; label: string; icon: string }> = {
  ok:       { color: C.success,  label: "OK",       icon: "check-circle" },
  overdue:  { color: C.warning,  label: "Zaległ.",  icon: "alert-circle" },
  critical: { color: C.danger,   label: "Krytycz.", icon: "x-circle"     },
};

function ClientCard({ client, onPress }: { client: Client; onPress: () => void }) {
  const { getClientOrders, getPaymentStatus } = useClientsContext();
  const { routes } = useRouteContext();
  const pConfig = PRIORITY_CONFIG[client.priority];
  const payStatus = getPaymentStatus(client);
  const payConfig = PAYMENT_CONFIG[payStatus];
  const clientOrders = getClientOrders(client.id);
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
    <Pressable style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]} onPress={onPress}>
      <View style={[styles.priorityBar, { backgroundColor: pConfig.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>{client.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
            {client.company && <Text style={styles.clientCompany} numberOfLines={1}>{client.company}</Text>}
            <View style={styles.addressRow}>
              <Feather name="map-pin" size={11} color={C.textTertiary} />
              <Text style={styles.clientAddress} numberOfLines={1}>{client.address}</Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.payBadge, { backgroundColor: payConfig.color + "18" }]}>
              <Feather name={payConfig.icon as any} size={10} color={payConfig.color} />
              <Text style={[styles.payBadgeText, { color: payConfig.color }]}>{payConfig.label}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={C.textTertiary} style={{ marginTop: 4 }} />
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statChip}>
            <Feather name="check-circle" size={11} color={C.success} />
            <Text style={styles.statChipText}>{visitCount} wizyt</Text>
          </View>
          <View style={styles.statChip}>
            <Feather name="shopping-bag" size={11} color="#8B5CF6" />
            <Text style={styles.statChipText}>{orderTotal > 0 ? `${orderTotal.toLocaleString("pl-PL")} zł` : "brak zamówień"}</Text>
          </View>
          {client.discount > 0 && (
            <View style={styles.statChip}>
              <Feather name="tag" size={11} color={C.accent} />
              <Text style={styles.statChipText}>-{client.discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          {client.phone && (
            <Pressable style={styles.actionBtn} onPress={handleCall}>
              <Feather name="phone" size={14} color={C.success} />
              <Text style={[styles.actionBtnText, { color: C.success }]}>{client.phone}</Text>
            </Pressable>
          )}
          {client.email && (
            <Pressable style={[styles.actionBtn, styles.emailBtn]} onPress={handleEmail}>
              <Feather name="mail" size={14} color={C.accent} />
              <Text style={[styles.actionBtnText, { color: C.accent }]} numberOfLines={1}>{client.email}</Text>
            </Pressable>
          )}
        </View>

        {client.currentDebt && client.currentDebt > 0 ? (
          <View style={styles.debtBanner}>
            <Feather name="alert-triangle" size={12} color={C.warning} />
            <Text style={styles.debtText}>Zaległość: <Text style={styles.debtValue}>{client.currentDebt.toLocaleString("pl-PL")} zł</Text> · {client.paymentDays} dni</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ClientsScreen() {
  const { clients, loading } = useClientsContext();
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
          <ClientCard client={item} onPress={() => setSelectedClient(item)} />
        )}
        ListHeaderComponent={
          <View style={{ paddingTop: topPad + 16 }}>
            <View style={styles.header}>
              <View>
                <Text style={styles.heroTitle}>Klienci</Text>
                <Text style={styles.heroSub}>{clients.length} kontrahentów w bazie</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => setAddVisible(true)}
              >
                <Feather name="user-plus" size={16} color="#fff" />
                <Text style={styles.addBtnText}>Dodaj</Text>
              </Pressable>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color={C.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Szukaj klienta..."
                  placeholderTextColor={C.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search ? (
                  <Pressable onPress={() => setSearch("")} hitSlop={8}>
                    <Feather name="x" size={16} color={C.textTertiary} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.sortRow}>
              {([["name", "A–Z"], ["priority", "Priorytet"], ["recent", "Ostatnio dodani"]] as [SortBy, string][]).map(([v, l]) => (
                <Pressable
                  key={v}
                  style={[styles.sortChip, sortBy === v && styles.sortChipActive]}
                  onPress={async () => { await Haptics.selectionAsync(); setSortBy(v); }}
                >
                  <Text style={[styles.sortText, sortBy === v && styles.sortTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>

            {filtered.length === 0 && clients.length > 0 && (
              <View style={styles.noResults}>
                <Feather name="search" size={24} color={C.textTertiary} />
                <Text style={styles.noResultsText}>Brak wyników dla "{search}"</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          clients.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Feather name="users" size={36} color={C.accent} /></View>
              <Text style={styles.emptyTitle}>Brak klientów w CRM</Text>
              <Text style={styles.emptySub}>Dodaj pierwszego kontrahenta – jego dane, warunki handlowe i historię wizyt będziesz miał zawsze pod ręką.</Text>
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
  listContent: { paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  heroTitle: { fontSize: 28, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  searchRow: { marginBottom: 10 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.text, fontFamily: "Inter_400Regular" },
  sortRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  sortChipActive: { backgroundColor: "#EFF6FF", borderColor: C.accent },
  sortText: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  sortTextActive: { color: C.accent, fontFamily: "Inter_600SemiBold" },
  noResults: { alignItems: "center", gap: 8, paddingTop: 32 },
  noResultsText: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  card: {
    flexDirection: "row", backgroundColor: C.surface, borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  priorityBar: { width: 4, flexShrink: 0 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  clientAvatarText: { fontSize: 18, fontWeight: "700", color: C.accent, fontFamily: "Inter_700Bold" },
  clientInfo: { flex: 1, gap: 3 },
  clientName: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  clientCompany: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  clientAddress: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular", flex: 1 },
  cardRight: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  payBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  payBadgeText: { fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  cardStats: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  statChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.backgroundTertiary, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  statChipText: { fontSize: 11, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#ECFDF5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, flex: 1 },
  emailBtn: { backgroundColor: "#EFF6FF" },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  debtBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFBEB", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  debtText: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  debtValue: { fontFamily: "Inter_600SemiBold", color: C.warning },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24, gap: 12 },
  emptyIcon: { width: 76, height: 76, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    backgroundColor: C.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24,
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  emptyBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
