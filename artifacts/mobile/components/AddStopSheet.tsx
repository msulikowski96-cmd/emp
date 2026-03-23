import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
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
import { useRouteContext, type Priority } from "@/context/RouteContext";

const C = Colors.light;

const PRIORITIES: { value: Priority; label: string; color: string; bg: string; icon: string }[] = [
  { value: "high", label: "Wysoki", color: "#EF4444", bg: "#FEF2F2", icon: "arrow-up" },
  { value: "medium", label: "Średni", color: "#F59E0B", bg: "#FFFBEB", icon: "minus" },
  { value: "low", label: "Niski", color: "#10B981", bg: "#ECFDF5", icon: "arrow-down" },
];

export default function AddStopScreen() {
  const { addStop } = useRouteContext();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});
  const addressRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const validate = () => {
    const e: { name?: string; address?: string } = {};
    if (!name.trim()) e.name = "Podaj nazwę klienta";
    if (!address.trim()) e.address = "Podaj adres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    try {
      await addStop({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
        priority,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Nowy punkt</Text>
          <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
            <Feather name="x" size={20} color={C.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>Nazwa klienta *</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="np. Jan Kowalski / ABC Sp. z o.o."
              placeholderTextColor={C.textTertiary}
              value={name}
              onChangeText={(t) => { setName(t); setErrors((p) => ({ ...p, name: undefined })); }}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => addressRef.current?.focus()}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Adres *</Text>
            <TextInput
              ref={addressRef}
              style={[styles.input, styles.inputMulti, errors.address ? styles.inputError : null]}
              placeholder="ul. Przykładowa 1, Warszawa"
              placeholderTextColor={C.textTertiary}
              value={address}
              onChangeText={(t) => { setAddress(t); setErrors((p) => ({ ...p, address: undefined })); }}
              multiline
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefon</Text>
            <View style={styles.phoneRow}>
              <View style={styles.phoneIcon}>
                <Feather name="phone" size={16} color={C.textTertiary} />
              </View>
              <TextInput
                ref={phoneRef}
                style={[styles.input, styles.phoneInput]}
                placeholder="+48 123 456 789"
                placeholderTextColor={C.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => noteRef.current?.focus()}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Priorytet</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.value}
                  style={[styles.priorityBtn, priority === p.value && { backgroundColor: p.bg, borderColor: p.color }]}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setPriority(p.value);
                  }}
                >
                  <Feather name={p.icon as any} size={14} color={priority === p.value ? p.color : C.textTertiary} />
                  <Text style={[styles.priorityText, priority === p.value && { color: p.color, fontFamily: "Inter_600SemiBold" }]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notatka przed wizytą</Text>
            <TextInput
              ref={noteRef}
              style={[styles.input, styles.inputNote]}
              placeholder="np. kod do klatki: 1234, zapytać o zamówienie #45"
              placeholderTextColor={C.textTertiary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 8 }} />
        </ScrollView>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, saving && styles.saveBtnDisabled, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Dodaj punkt</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  form: { flex: 1 },
  field: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "600", color: C.textSecondary, marginBottom: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
  input: { backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: "Inter_400Regular" },
  inputMulti: { minHeight: 70, textAlignVertical: "top" },
  inputNote: { minHeight: 85, textAlignVertical: "top" },
  inputError: { borderColor: C.danger },
  errorText: { fontSize: 12, color: C.danger, marginTop: 4, fontFamily: "Inter_400Regular" },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  phoneIcon: { position: "absolute", left: 16, zIndex: 1, paddingTop: 1 },
  phoneInput: { flex: 1, paddingLeft: 44 },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.surface,
  },
  priorityText: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  saveBtn: {
    backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
