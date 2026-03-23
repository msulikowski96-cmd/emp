import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import type { RouteStop, VisitStatus } from "@/context/RouteContext";

const C = Colors.light;

interface StopCardProps {
  stop: RouteStop;
  index: number;
  onStatusChange: (id: string, status: VisitStatus) => void;
  onDelete?: (id: string) => void;
  onEdit?: (stop: RouteStop) => void;
  showOrder?: boolean;
  compact?: boolean;
}

const STATUS_CONFIG: Record<VisitStatus, { label: string; color: string; bg: string; icon: string }> = {
  planned: { label: "Zaplanowana", color: C.statusPlanned, bg: "#EFF6FF", icon: "clock" },
  active: { label: "W trakcie", color: C.statusActive, bg: "#FFFBEB", icon: "navigation" },
  visited: { label: "Odwiedzona", color: C.statusVisited, bg: "#ECFDF5", icon: "check-circle" },
};

export function StopCard({ stop, index, onStatusChange, onDelete, onEdit, showOrder = true, compact = false }: StopCardProps) {
  const config = STATUS_CONFIG[stop.status];

  const handleNavigate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(stop.address);
    const url = Platform.OS === "ios"
      ? `maps://?q=${query}`
      : `geo:0,0?q=${query}`;
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Linking.openURL(gmapsUrl);
    }
  };

  const cycleStatus = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next: Record<VisitStatus, VisitStatus> = {
      planned: "active",
      active: "visited",
      visited: "planned",
    };
    onStatusChange(stop.id, next[stop.status]);
  };

  return (
    <View style={[styles.card, stop.status === "visited" && styles.cardVisited]}>
      <View style={styles.row}>
        {showOrder && (
          <View style={[styles.orderBadge, { backgroundColor: config.color }]}>
            <Text style={styles.orderText}>{index + 1}</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={[styles.name, stop.status === "visited" && styles.nameVisited]} numberOfLines={1}>
            {stop.name}
          </Text>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={12} color={C.textTertiary} />
            <Text style={styles.address} numberOfLines={1}>{stop.address}</Text>
          </View>
          {stop.note ? (
            <Text style={styles.note} numberOfLines={1}>{stop.note}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.statusPill, { backgroundColor: config.bg }]}
            onPress={cycleStatus}
            hitSlop={6}
          >
            <Feather name={config.icon as any} size={12} color={config.color} />
          </Pressable>

          <Pressable style={styles.navBtn} onPress={handleNavigate} hitSlop={6}>
            <Feather name="navigation-2" size={16} color={C.accent} />
          </Pressable>

          {onDelete && (
            <Pressable
              style={styles.deleteBtn}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDelete(stop.id);
              }}
              hitSlop={6}
            >
              <Feather name="trash-2" size={15} color={C.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {stop.visitedAt && stop.status === "visited" && (
        <View style={styles.visitedTag}>
          <Feather name="check" size={11} color={C.success} />
          <Text style={styles.visitedTime}>
            {new Date(stop.visitedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  cardVisited: {
    opacity: 0.7,
    backgroundColor: "#F8FAFC",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  nameVisited: {
    color: C.textSecondary,
    textDecorationLine: "line-through",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  address: {
    fontSize: 12,
    color: C.textTertiary,
    flex: 1,
    fontFamily: "Inter_400Regular",
  },
  note: {
    fontSize: 12,
    color: C.textSecondary,
    fontStyle: "italic",
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  statusPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  visitedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  visitedTime: {
    fontSize: 11,
    color: C.success,
    fontFamily: "Inter_500Medium",
  },
});
