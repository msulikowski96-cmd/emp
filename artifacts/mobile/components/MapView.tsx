import { Feather } from "@expo/vector-icons";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import type { RouteStop } from "@/context/RouteContext";

const C = Colors.light;

interface MapViewProps {
  stops: RouteStop[];
}

export function RouteMapView({ stops }: MapViewProps) {
  const openInMaps = () => {
    const addresses = stops
      .filter((s) => s.status !== "visited")
      .map((s) => encodeURIComponent(s.address))
      .join("/");

    if (stops.length === 0) return;

    const firstStop = stops.find((s) => s.status !== "visited");
    if (!firstStop) return;

    const query = encodeURIComponent(firstStop.address);
    const url =
      Platform.OS === "ios"
        ? `maps://?q=${query}`
        : `geo:0,0?q=${query}`;
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(url).then((supported) => {
      Linking.openURL(supported ? url : gmapsUrl);
    });
  };

  const activeStops = stops.filter((s) => s.status !== "visited");

  if (stops.length === 0) {
    return (
      <View style={styles.emptyMap}>
        <Feather name="map" size={32} color={C.textTertiary} />
        <Text style={styles.emptyText}>Brak punktów na trasie</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.routeList}>
        {stops.slice(0, 5).map((stop, idx) => (
          <View key={stop.id} style={styles.routeItem}>
            <View style={[styles.dot, { backgroundColor: stop.status === "visited" ? C.success : stop.status === "active" ? C.warning : C.accent }]} />
            {idx < stops.slice(0, 5).length - 1 && <View style={styles.line} />}
            <Text style={[styles.routeText, stop.status === "visited" && styles.routeTextVisited]} numberOfLines={1}>
              {stop.name}
            </Text>
          </View>
        ))}
        {stops.length > 5 && (
          <Text style={styles.moreText}>+{stops.length - 5} więcej...</Text>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.openMapBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={openInMaps}
        disabled={activeStops.length === 0}
      >
        <Feather name="navigation" size={16} color="#fff" />
        <Text style={styles.openMapText}>Otwórz nawigację</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyMap: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 32,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  routeList: {
    marginBottom: 14,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 3,
    gap: 10,
    position: "relative",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  line: {
    position: "absolute",
    left: 4.5,
    top: 18,
    bottom: -6,
    width: 1,
    backgroundColor: C.border,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
  routeTextVisited: {
    color: C.textTertiary,
    textDecorationLine: "line-through",
  },
  moreText: {
    fontSize: 12,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    marginLeft: 20,
    marginTop: 4,
  },
  openMapBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  openMapText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
