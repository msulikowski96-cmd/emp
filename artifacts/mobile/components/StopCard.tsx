import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import type { Priority, RouteStop, VisitStatus } from "@/context/RouteContext";
import { VisitReportModal } from "@/components/VisitReportModal";

const C = Colors.light;

const STATUS_CONFIG: Record<VisitStatus, { label: string; color: string; bg: string; icon: string }> = {
  planned: { label: "Zaplanowana", color: C.statusPlanned, bg: "#EFF6FF", icon: "clock" },
  active:  { label: "W trakcie",   color: C.statusActive,  bg: "#FFFBEB", icon: "navigation" },
  visited: { label: "Odwiedzona",  color: C.statusVisited, bg: "#ECFDF5", icon: "check-circle" },
};

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; icon: string; label: string }> = {
  high:   { color: "#EF4444", bg: "#FEF2F2", icon: "arrow-up",   label: "Wysoki" },
  medium: { color: "#F59E0B", bg: "#FFFBEB", icon: "minus",      label: "Średni" },
  low:    { color: "#10B981", bg: "#ECFDF5", icon: "arrow-down", label: "Niski"  },
};

interface StopCardProps {
  stop: RouteStop;
  index: number;
  onStatusChange: (id: string, status: VisitStatus) => void;
  onVisitReport: (id: string, note: string, orderValue?: string) => Promise<void>;
  onDelete?: (id: string) => void;
  showOrder?: boolean;
}

export function StopCard({ stop, index, onStatusChange, onVisitReport, onDelete, showOrder = true }: StopCardProps) {
  const sConfig = STATUS_CONFIG[stop.status];
  const pConfig = PRIORITY_CONFIG[stop.priority];
  const [reportVisible, setReportVisible] = useState(false);

  const handleNavigate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(stop.address);
    const nativeUrl = Platform.OS === "ios" ? `maps://?q=${query}` : `geo:0,0?q=${query}`;
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    const supported = await Linking.canOpenURL(nativeUrl);
    Linking.openURL(supported ? nativeUrl : gmapsUrl);
  };

  const handleCall = async () => {
    if (!stop.phone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tel = `tel:${stop.phone.replace(/\s/g, "")}`;
    Linking.openURL(tel);
  };

  const cycleStatus = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (stop.status === "planned") {
      onStatusChange(stop.id, "active");
    } else if (stop.status === "active") {
      setReportVisible(true);
    } else {
      onStatusChange(stop.id, "planned");
    }
  };

  return (
    <>
      <View style={[styles.card, stop.status === "visited" && styles.cardVisited, stop.priority === "high" && stop.status !== "visited" && styles.cardHigh]}>
        {stop.priority === "high" && stop.status !== "visited" && (
          <View style={styles.priorityStripe} />
        )}

        <View style={styles.topRow}>
          {showOrder && (
            <View style={[styles.orderBadge, { backgroundColor: sConfig.color }]}>
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.nameLine}>
              <Text style={[styles.name, stop.status === "visited" && styles.nameVisited]} numberOfLines={1}>
                {stop.name}
              </Text>
              <View style={[styles.priorityBadge, { backgroundColor: pConfig.bg }]}>
                <Feather name={pConfig.icon as any} size={10} color={pConfig.color} />
              </View>
            </View>
            <View style={styles.addressRow}>
              <Feather name="map-pin" size={11} color={C.textTertiary} />
              <Text style={styles.address} numberOfLines={1}>{stop.address}</Text>
            </View>
            {stop.phone ? (
              <View style={styles.phoneRow}>
                <Feather name="phone" size={11} color={C.textTertiary} />
                <Text style={styles.phone}>{stop.phone}</Text>
              </View>
            ) : null}
            {stop.note && stop.status !== "visited" ? (
              <Text style={styles.preNote} numberOfLines={1}>{stop.note}</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.statusBtn, { backgroundColor: sConfig.bg }]} onPress={cycleStatus} hitSlop={5}>
              <Feather name={sConfig.icon as any} size={13} color={sConfig.color} />
            </Pressable>

            {stop.phone ? (
              <Pressable style={styles.callBtn} onPress={handleCall} hitSlop={5}>
                <Feather name="phone-call" size={15} color={C.success} />
              </Pressable>
            ) : null}

            <Pressable style={styles.navBtn} onPress={handleNavigate} hitSlop={5}>
              <Feather name="navigation-2" size={15} color={C.accent} />
            </Pressable>

            {onDelete && (
              <Pressable style={styles.deleteBtn} onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDelete(stop.id); }} hitSlop={5}>
                <Feather name="trash-2" size={14} color={C.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {stop.status === "visited" && (stop.visitedAt || stop.visitNote || stop.orderValue) && (
          <View style={styles.visitSummary}>
            <View style={styles.visitHeader}>
              <Feather name="check-circle" size={12} color={C.success} />
              <Text style={styles.visitTime}>
                Odwiedzona {stop.visitedAt ? new Date(stop.visitedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : ""}
              </Text>
            </View>
            {stop.orderValue ? (
              <View style={styles.orderValueRow}>
                <Feather name="shopping-bag" size={11} color={C.accent} />
                <Text style={styles.orderValueText}>{stop.orderValue}</Text>
              </View>
            ) : null}
            {stop.visitNote ? (
              <Text style={styles.visitNote} numberOfLines={2}>{stop.visitNote}</Text>
            ) : null}
          </View>
        )}
      </View>

      <VisitReportModal
        visible={reportVisible}
        stopName={stop.name}
        onClose={() => setReportVisible(false)}
        onConfirm={async (note, orderValue) => {
          setReportVisible(false);
          await onVisitReport(stop.id, note, orderValue);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1,
    overflow: "hidden",
  },
  cardVisited: { opacity: 0.68, backgroundColor: "#F8FAFC" },
  cardHigh: { borderColor: "#FECACA" },
  priorityStripe: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: "#EF4444" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  orderText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  content: { flex: 1, gap: 3 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  nameVisited: { color: C.textSecondary, textDecorationLine: "line-through" },
  priorityBadge: { width: 18, height: 18, borderRadius: 5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { fontSize: 12, color: C.textTertiary, flex: 1, fontFamily: "Inter_400Regular" },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  phone: { fontSize: 12, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  preNote: { fontSize: 12, color: C.textSecondary, fontStyle: "italic", fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  statusBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  callBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center" },
  navBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  deleteBtn: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  visitSummary: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.borderLight, gap: 4 },
  visitHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  visitTime: { fontSize: 11, color: C.success, fontFamily: "Inter_500Medium" },
  orderValueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  orderValueText: { fontSize: 12, color: C.accent, fontFamily: "Inter_600SemiBold" },
  visitNote: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
