import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import type { RouteStop } from "@/context/RouteContext";

const C = Colors.light;

interface NextStopBannerProps {
  stop: RouteStop;
  onStartVisit: () => void;
}

export function NextStopBanner({ stop, onStartVisit }: NextStopBannerProps) {
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

  return (
    <View style={[styles.banner, isActive && styles.bannerActive]}>
      <View style={styles.label}>
        <View style={[styles.dot, { backgroundColor: isActive ? C.statusActive : C.accent }]} />
        <Text style={[styles.labelText, { color: isActive ? C.statusActive : C.accent }]}>
          {isActive ? "W TRAKCIE" : "NASTĘPNY PUNKT"}
        </Text>
      </View>

      <Text style={styles.name} numberOfLines={1}>{stop.name}</Text>
      <View style={styles.addressRow}>
        <Feather name="map-pin" size={13} color={isActive ? "#FBBF24" : "#93C5FD"} />
        <Text style={styles.address} numberOfLines={1}>{stop.address}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={handleNavigate}
        >
          <Feather name="navigation" size={16} color="#fff" />
          <Text style={styles.navText}>Nawiguj</Text>
        </Pressable>

        {stop.phone ? (
          <Pressable style={({ pressed }) => [styles.callBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={handleCall}>
            <Feather name="phone" size={16} color={isActive ? C.statusActive : C.accent} />
          </Pressable>
        ) : null}

        {!isActive && (
          <Pressable
            style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onStartVisit();
            }}
          >
            <Feather name="play" size={16} color={isActive ? "#fff" : C.accent} />
            <Text style={[styles.startText, { color: C.accent }]}>Zacznij</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 6,
  },
  bannerActive: {
    backgroundColor: "#78350F",
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  address: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    flex: 1,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  navBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  navText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  startText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
