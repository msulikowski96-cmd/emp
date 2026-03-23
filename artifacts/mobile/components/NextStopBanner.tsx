import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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

  const gradients: [string, string, string] = isActive
    ? ["#78350F", "#92400E", "#B45309"]
    : ["#1E3A8A", "#1D4ED8", "#2563EB"];

  return (
    <LinearGradient colors={gradients} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.labelRow}>
        <View style={[styles.statusDot, { backgroundColor: isActive ? "#FCD34D" : "#93C5FD" }]} />
        <Text style={[styles.statusLabel, { color: isActive ? "#FCD34D" : "#93C5FD" }]}>
          {isActive ? "WIZYTA W TRAKCIE" : "NASTĘPNY KLIENT"}
        </Text>
      </View>

      <Text style={styles.clientName} numberOfLines={1}>{stop.name}</Text>

      <View style={styles.addressRow}>
        <Feather name="map-pin" size={13} color="rgba(255,255,255,0.6)" />
        <Text style={styles.address} numberOfLines={1}>{stop.address}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={handleNavigate}>
          <Feather name="navigation" size={16} color="#fff" />
          <Text style={styles.navText}>Nawiguj</Text>
        </Pressable>

        {stop.phone && (
          <Pressable style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={handleCall}>
            <Feather name="phone" size={17} color="#fff" />
          </Pressable>
        )}

        {!isActive && (
          <Pressable
            style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onStartVisit(); }}
          >
            <Feather name="play" size={15} color={C.accent} />
            <Text style={styles.startText}>Zacznij</Text>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 18, padding: 18, marginBottom: 14, gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  clientName: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", lineHeight: 28 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  address: { fontSize: 13, color: "rgba(255,255,255,0.65)", flex: 1, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  navBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  navText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  startBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 16,
  },
  startText: { color: C.accent, fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
