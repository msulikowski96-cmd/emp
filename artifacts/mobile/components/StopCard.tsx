import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import type { Priority, RouteStop, VisitStatus } from "@/context/RouteContext";
import { VisitReportModal } from "@/components/VisitReportModal";

const C = Colors.light;

const STATUS_CONFIG: Record<VisitStatus, { label: string; color: string; bg: string; icon: string }> = {
  planned: { label: "Zaplanowana", color: C.statusPlanned, bg: "#DBEAFE", icon: "clock"         },
  active:  { label: "W trakcie",   color: C.statusActive,  bg: "#FEF3C7", icon: "navigation"    },
  visited: { label: "Odwiedzona",  color: C.statusVisited, bg: "#D1FAE5", icon: "check-circle"  },
};

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string }> = {
  high:   { color: "#EF4444", bg: "#FEE2E2", label: "Wysoki"  },
  medium: { color: "#F59E0B", bg: "#FEF3C7", label: "Średni"  },
  low:    { color: "#10B981", bg: "#D1FAE5", label: "Niski"   },
};

const AVATAR_COLORS = [
  "#2563EB", "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626", "#9333EA",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
  const avatarColor = getAvatarColor(stop.name);
  const isVisited = stop.status === "visited";
  const isActive = stop.status === "active";

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
    Linking.openURL(`tel:${stop.phone.replace(/\s/g, "")}`);
  };

  const cycleStatus = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (stop.status === "planned") { onStatusChange(stop.id, "active"); }
    else if (stop.status === "active") { setReportVisible(true); }
    else { onStatusChange(stop.id, "planned"); }
  };

  return (
    <>
      <View style={[
        styles.card,
        isVisited && styles.cardVisited,
        isActive && styles.cardActive,
        stop.priority === "high" && !isVisited && styles.cardHighPriority,
      ]}>
        <View style={[styles.priorityStripe, { backgroundColor: isVisited ? C.statusVisited : pConfig.color }]} />

        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={[styles.avatar, { backgroundColor: isVisited ? "#94A3B8" : avatarColor }]}>
              <Text style={styles.avatarText}>{stop.name.charAt(0).toUpperCase()}</Text>
              {showOrder && (
                <View style={styles.orderDot}>
                  <Text style={styles.orderDotText}>{index + 1}</Text>
                </View>
              )}
            </View>

            <View style={styles.nameSection}>
              <View style={styles.nameLine}>
                <Text style={[styles.name, isVisited && styles.nameVisited]} numberOfLines={1}>{stop.name}</Text>
                <View style={[styles.priorityPill, { backgroundColor: pConfig.bg }]}>
                  <Text style={[styles.priorityPillText, { color: pConfig.color }]}>{pConfig.label}</Text>
                </View>
              </View>
              <View style={styles.addressLine}>
                <Feather name="map-pin" size={11} color={C.textTertiary} />
                <Text style={styles.address} numberOfLines={1}>{stop.address}</Text>
              </View>
              {stop.phone && (
                <View style={styles.phoneLine}>
                  <Feather name="phone" size={11} color={C.textTertiary} />
                  <Text style={styles.phone}>{stop.phone}</Text>
                </View>
              )}
              {stop.note && !isVisited && (
                <View style={styles.noteLine}>
                  <Feather name="file-text" size={10} color={C.textTertiary} />
                  <Text style={styles.noteText} numberOfLines={1}>{stop.note}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.bottomRow}>
            <Pressable style={[styles.statusChip, { backgroundColor: sConfig.bg }]} onPress={cycleStatus}>
              <Feather name={sConfig.icon as any} size={12} color={sConfig.color} />
              <Text style={[styles.statusChipText, { color: sConfig.color }]}>{sConfig.label}</Text>
            </Pressable>

            <View style={styles.actionButtons}>
              {stop.phone && (
                <Pressable style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
                  <Feather name="phone-call" size={14} color={C.success} />
                </Pressable>
              )}
              <Pressable style={[styles.actionBtn, styles.navBtn]} onPress={handleNavigate}>
                <Feather name="navigation-2" size={14} color={C.accent} />
              </Pressable>
              {onDelete && (
                <Pressable style={[styles.actionBtn, styles.delBtn]} onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDelete(stop.id); }}>
                  <Feather name="trash-2" size={13} color={C.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>

          {isVisited && (stop.visitedAt || stop.visitNote || stop.orderValue) && (
            <View style={styles.visitSummary}>
              <View style={styles.visitSummaryHeader}>
                <Feather name="check-circle" size={12} color={C.success} />
                <Text style={styles.visitTime}>
                  Odwiedzona {stop.visitedAt ? new Date(stop.visitedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : ""}
                </Text>
                {stop.orderValue && (
                  <>
                    <View style={styles.dot} />
                    <Feather name="shopping-bag" size={11} color="#8B5CF6" />
                    <Text style={styles.orderValueText}>{stop.orderValue}</Text>
                  </>
                )}
              </View>
              {stop.visitNote && <Text style={styles.visitNote} numberOfLines={2}>{stop.visitNote}</Text>}
            </View>
          )}
        </View>
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
    backgroundColor: C.surface,
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: "row",
    shadowColor: "rgba(15,23,42,0.12)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  cardVisited: { opacity: 0.72, backgroundColor: "#F8FAFC" },
  cardActive: { borderColor: "#FCD34D", shadowColor: "rgba(245,158,11,0.2)" },
  cardHighPriority: { borderColor: "#FCA5A5" },
  priorityStripe: { width: 4, flexShrink: 0 },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: {
    width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center",
    flexShrink: 0, position: "relative",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  orderDot: {
    position: "absolute", bottom: -4, right: -4,
    backgroundColor: "#0F172A", borderRadius: 7, minWidth: 16, height: 16,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.surface,
  },
  orderDotText: { fontSize: 9, color: "#fff", fontFamily: "Inter_700Bold" },
  nameSection: { flex: 1, gap: 4 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  name: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  nameVisited: { color: C.textSecondary, textDecorationLine: "line-through" },
  priorityPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  priorityPillText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  addressLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { fontSize: 12, color: C.textTertiary, flex: 1, fontFamily: "Inter_400Regular" },
  phoneLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  phone: { fontSize: 12, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  noteLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  noteText: { fontSize: 11, color: C.textTertiary, fontStyle: "italic", fontFamily: "Inter_400Regular", flex: 1 },
  divider: { height: 1, backgroundColor: C.borderLight, marginVertical: 12 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  statusChipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  actionButtons: { flexDirection: "row", gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  callBtn: { backgroundColor: "#D1FAE5" },
  navBtn: { backgroundColor: "#DBEAFE" },
  delBtn: { backgroundColor: C.backgroundTertiary },
  visitSummary: { backgroundColor: "#F0FDF4", borderRadius: 10, padding: 10, marginTop: 10, gap: 4 },
  visitSummaryHeader: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  visitTime: { fontSize: 11, color: C.success, fontFamily: "Inter_500Medium", flex: 1 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textTertiary },
  orderValueText: { fontSize: 11, color: "#8B5CF6", fontFamily: "Inter_600SemiBold" },
  visitNote: { fontSize: 12, color: "#166534", fontFamily: "Inter_400Regular", lineHeight: 18 },
});
