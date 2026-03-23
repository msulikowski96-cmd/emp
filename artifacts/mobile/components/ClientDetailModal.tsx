import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useClientsContext, type Client, type ClientOrder } from "@/context/ClientsContext";
import { useRouteContext } from "@/context/RouteContext";
import { AddClientModal } from "@/components/AddClientModal";
import { OrderModal } from "@/components/OrderModal";

const C = Colors.light;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Robocze",   color: C.textSecondary, bg: C.backgroundTertiary },
  confirmed: { label: "Potwierdz.", color: C.accent, bg: "#EFF6FF" },
  delivered: { label: "Dostarczone", color: C.success, bg: "#ECFDF5" },
  cancelled: { label: "Anulowane", color: C.danger, bg: "#FEF2F2" },
};

function OrderRow({ order, onUpdateStatus }: { order: ClientOrder; onUpdateStatus: (id: string, status: any) => void }) {
  const sConfig = STATUS_CONFIG[order.status];
  const date = new Date(order.date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });

  return (
    <View style={styles.orderRow}>
      <View style={styles.orderLeft}>
        <Text style={styles.orderDate}>{date}</Text>
        <Text style={styles.orderItems}>{order.items.length} pozycji</Text>
      </View>
      <View style={styles.orderMid}>
        {order.items.slice(0, 2).map((item) => (
          <Text key={item.id} style={styles.orderItemName} numberOfLines={1}>{item.name} ×{item.quantity}</Text>
        ))}
        {order.items.length > 2 && <Text style={styles.orderMore}>+{order.items.length - 2} więcej</Text>}
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderTotal}>{order.total.toLocaleString("pl-PL")} zł</Text>
        <Pressable
          style={[styles.statusBadge, { backgroundColor: sConfig.bg }]}
          onPress={() => {
            Alert.alert("Status zamówienia", "Zmień status:", [
              { text: "Potwierdzone", onPress: () => onUpdateStatus(order.id, "confirmed") },
              { text: "Dostarczone", onPress: () => onUpdateStatus(order.id, "delivered") },
              { text: "Anulowane", style: "destructive", onPress: () => onUpdateStatus(order.id, "cancelled") },
              { text: "Anuluj", style: "cancel" },
            ]);
          }}
        >
          <Text style={[styles.statusText, { color: sConfig.color }]}>{sConfig.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface Props {
  client: Client;
  visible: boolean;
  onClose: () => void;
  onUpdated: (client: Client) => void;
}

export function ClientDetailModal({ client, visible, onClose, onUpdated }: Props) {
  const { deleteClient, getClientOrders, updateOrderStatus } = useClientsContext();
  const { routes } = useRouteContext();
  const insets = useSafeAreaInsets();
  const [editVisible, setEditVisible] = useState(false);
  const [orderVisible, setOrderVisible] = useState(false);
  const [tab, setTab] = useState<"info" | "orders" | "history">("info");

  const orders = getClientOrders(client.id);
  const visits = routes
    .flatMap((r) => r.stops.map((s) => ({ ...s, date: r.date })))
    .filter((s) => (s as any).clientId === client.id && s.status === "visited")
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  const handleCall = async () => {
    if (!client.phone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${client.phone.replace(/\s/g, "")}`);
  };
  const handleEmail = async () => {
    if (!client.email) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${client.email}`);
  };
  const handleNavigate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = encodeURIComponent(client.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const handleDelete = () => {
    Alert.alert("Usuń klienta", `Czy na pewno chcesz usunąć "${client.name}" z bazy CRM?`, [
      { text: "Anuluj", style: "cancel" },
      { text: "Usuń", style: "destructive", onPress: async () => { await deleteClient(client.id); onClose(); } },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Feather name="x" size={20} color={C.textSecondary} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => setEditVisible(true)} hitSlop={6}>
              <Feather name="edit-2" size={16} color={C.accent} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={handleDelete} hitSlop={6}>
              <Feather name="trash-2" size={16} color={C.danger} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.heroName}>{client.name}</Text>
            {client.company && <Text style={styles.heroCompany}>{client.company}</Text>}
            {client.nip && <Text style={styles.heroNip}>NIP: {client.nip}</Text>}

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{visits.length}</Text>
                <Text style={styles.heroStatLabel}>Wizyt</Text>
              </View>
              <View style={styles.heroStatDiv} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{orders.length}</Text>
                <Text style={styles.heroStatLabel}>Zamówień</Text>
              </View>
              <View style={styles.heroStatDiv} />
              <View style={styles.heroStat}>
                <Text style={[styles.heroStatVal, { color: "#8B5CF6" }]}>{totalRevenue > 0 ? totalRevenue.toLocaleString("pl-PL") + " zł" : "—"}</Text>
                <Text style={styles.heroStatLabel}>Przychód</Text>
              </View>
            </View>
          </View>

          <View style={styles.quickActions}>
            {client.phone && (
              <Pressable style={[styles.qBtn, styles.qBtnGreen]} onPress={handleCall}>
                <Feather name="phone" size={18} color={C.success} />
                <Text style={[styles.qBtnText, { color: C.success }]}>Zadzwoń</Text>
              </Pressable>
            )}
            {client.email && (
              <Pressable style={[styles.qBtn, styles.qBtnBlue]} onPress={handleEmail}>
                <Feather name="mail" size={18} color={C.accent} />
                <Text style={[styles.qBtnText, { color: C.accent }]}>E-mail</Text>
              </Pressable>
            )}
            <Pressable style={[styles.qBtn, styles.qBtnGray]} onPress={handleNavigate}>
              <Feather name="navigation" size={18} color={C.textSecondary} />
              <Text style={[styles.qBtnText, { color: C.textSecondary }]}>Nawiguj</Text>
            </Pressable>
          </View>

          <View style={styles.tabs}>
            {([["info", "Dane"], ["orders", "Zamówienia"], ["history", "Historia"]] as const).map(([t, l]) => (
              <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>

          {tab === "info" && (
            <View style={styles.infoSection}>
              <InfoRow icon="map-pin" label="Adres" value={client.address} />
              {client.phone && <InfoRow icon="phone" label="Telefon" value={client.phone} />}
              {client.email && <InfoRow icon="mail" label="E-mail" value={client.email} />}
              <View style={styles.sep} />
              <InfoRow icon="clock" label="Termin płatności" value={`${client.paymentDays} dni`} />
              <InfoRow icon="tag" label="Rabat" value={`${client.discount}%`} />
              {client.creditLimit ? <InfoRow icon="credit-card" label="Limit kredytowy" value={`${client.creditLimit.toLocaleString("pl-PL")} zł`} /> : null}
              {client.currentDebt && client.currentDebt > 0 ? (
                <View style={styles.debtRow}>
                  <Feather name="alert-triangle" size={14} color={C.warning} />
                  <Text style={styles.debtLabel}>Zaległość</Text>
                  <Text style={styles.debtVal}>{client.currentDebt.toLocaleString("pl-PL")} zł</Text>
                </View>
              ) : null}
              {client.notes && (
                <>
                  <View style={styles.sep} />
                  <View style={styles.notesBox}>
                    <Feather name="file-text" size={13} color={C.textSecondary} />
                    <Text style={styles.notesText}>{client.notes}</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {tab === "orders" && (
            <View style={styles.ordersSection}>
              <Pressable style={styles.addOrderBtn} onPress={() => setOrderVisible(true)}>
                <Feather name="plus" size={15} color={C.accent} />
                <Text style={styles.addOrderText}>Nowe zamówienie</Text>
              </Pressable>
              {orders.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Feather name="shopping-bag" size={28} color={C.textTertiary} />
                  <Text style={styles.emptyTabText}>Brak zamówień dla tego klienta</Text>
                </View>
              ) : (
                orders.map((o) => <OrderRow key={o.id} order={o} onUpdateStatus={updateOrderStatus} />)
              )}
            </View>
          )}

          {tab === "history" && (
            <View style={styles.historySection}>
              {visits.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Feather name="calendar" size={28} color={C.textTertiary} />
                  <Text style={styles.emptyTabText}>Brak wizyt. Powiąż punkt trasy z tym klientem, aby śledzić historię.</Text>
                </View>
              ) : (
                visits.map((v, i) => (
                  <View key={i} style={styles.historyRow}>
                    <View style={styles.histDot} />
                    <View style={styles.histContent}>
                      <Text style={styles.histDate}>{new Date(v.date + "T12:00:00").toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}</Text>
                      {v.visitedAt && <Text style={styles.histTime}>{new Date(v.visitedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</Text>}
                      {v.visitNote && <Text style={styles.histNote}>{v.visitNote}</Text>}
                      {v.orderValue && <Text style={styles.histOrder}>Zamówienie: {v.orderValue}</Text>}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <AddClientModal visible={editVisible} editClient={client} onClose={() => setEditVisible(false)} onSaved={onUpdated} />
        <OrderModal visible={orderVisible} clientId={client.id} clientName={client.name} discount={client.discount} onClose={() => setOrderVisible(false)} />
      </View>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Feather name={icon as any} size={14} color={C.textSecondary} /></View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  hero: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20, gap: 6 },
  avatar: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  avatarText: { fontSize: 32, fontWeight: "700", color: C.accent, fontFamily: "Inter_700Bold" },
  heroName: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroCompany: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  heroNip: { fontSize: 12, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  heroStats: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 12, gap: 0, marginTop: 10, width: "100%" },
  heroStat: { flex: 1, alignItems: "center", gap: 2 },
  heroStatVal: { fontSize: 18, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  heroStatLabel: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  heroStatDiv: { width: 1, height: 30, backgroundColor: C.border },
  quickActions: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  qBtn: { flex: 1, flexDirection: "column", alignItems: "center", gap: 5, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  qBtnGreen: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  qBtnBlue: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  qBtnGray: { backgroundColor: C.backgroundTertiary, borderColor: C.border },
  qBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabs: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 16, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: "#EFF6FF", borderColor: C.accent },
  tabText: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  tabTextActive: { color: C.accent, fontFamily: "Inter_600SemiBold" },
  infoSection: { paddingHorizontal: 16, gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  infoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: C.text, fontFamily: "Inter_500Medium", marginTop: 2 },
  sep: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  debtRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFBEB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  debtLabel: { flex: 1, fontSize: 13, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  debtVal: { fontSize: 14, color: C.warning, fontFamily: "Inter_700Bold" },
  notesBox: { flexDirection: "row", gap: 8, backgroundColor: C.backgroundTertiary, borderRadius: 10, padding: 12 },
  notesText: { flex: 1, fontSize: 13, color: C.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 20 },
  ordersSection: { paddingHorizontal: 16 },
  addOrderBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, justifyContent: "center", marginBottom: 14 },
  addOrderText: { fontSize: 14, color: C.accent, fontFamily: "Inter_600SemiBold" },
  orderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  orderLeft: { width: 50 },
  orderDate: { fontSize: 12, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  orderItems: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_400Regular", marginTop: 2 },
  orderMid: { flex: 1 },
  orderItemName: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  orderMore: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  orderRight: { alignItems: "flex-end", gap: 4 },
  orderTotal: { fontSize: 14, fontWeight: "700", color: "#8B5CF6", fontFamily: "Inter_700Bold" },
  statusBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  historySection: { paddingHorizontal: 16 },
  historyRow: { flexDirection: "row", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  histDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success, marginTop: 4, flexShrink: 0 },
  histContent: { flex: 1, gap: 4 },
  histDate: { fontSize: 13, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  histTime: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  histNote: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
  histOrder: { fontSize: 12, color: "#8B5CF6", fontFamily: "Inter_600SemiBold" },
  emptyTab: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyTabText: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
