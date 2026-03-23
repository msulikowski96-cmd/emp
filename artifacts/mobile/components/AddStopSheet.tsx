import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useRouteContext } from "@/context/RouteContext";

const C = Colors.light;

export default function AddStopScreen() {
  const { addStop } = useRouteContext();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});

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
      await addStop({ name: name.trim(), address: address.trim(), note: note.trim() || undefined });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Nowy punkt</Text>
          <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={8}>
            <Feather name="x" size={20} color={C.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.field}>
            <Text style={styles.label}>Nazwa klienta *</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="np. Jan Kowalski"
              placeholderTextColor={C.textTertiary}
              value={name}
              onChangeText={(t) => { setName(t); setErrors(p => ({ ...p, name: undefined })); }}
              autoFocus
              returnKeyType="next"
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Adres *</Text>
            <TextInput
              style={[styles.input, styles.inputAddress, errors.address ? styles.inputError : null]}
              placeholder="ul. Przykładowa 1, Warszawa"
              placeholderTextColor={C.textTertiary}
              value={address}
              onChangeText={(t) => { setAddress(t); setErrors(p => ({ ...p, address: undefined })); }}
              multiline
              returnKeyType="next"
              numberOfLines={2}
            />
            {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notatka (opcjonalnie)</Text>
            <TextInput
              style={[styles.input, styles.inputNote]}
              placeholder="np. kod do klatki: 1234"
              placeholderTextColor={C.textTertiary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>
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
  container: {
    flex: 1,
    backgroundColor: C.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    flex: 1,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 8,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    fontFamily: "Inter_400Regular",
  },
  inputAddress: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  inputNote: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: C.danger,
  },
  errorText: {
    fontSize: 12,
    color: C.danger,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
