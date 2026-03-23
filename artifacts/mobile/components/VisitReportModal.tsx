import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const C = Colors.light;

interface VisitReportModalProps {
  visible: boolean;
  stopName: string;
  onClose: () => void;
  onConfirm: (note: string, orderValue?: string) => Promise<void>;
}

export function VisitReportModal({ visible, stopName, onClose, onConfirm }: VisitReportModalProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");
  const [orderValue, setOrderValue] = useState("");
  const [saving, setSaving] = useState(false);
  const noteRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setNote("");
      setOrderValue("");
      setSaving(false);
      setTimeout(() => noteRef.current?.focus(), 300);
    }
  }, [visible]);

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    await onConfirm("", "");
  };

  const handleSave = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    await onConfirm(note, orderValue);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Feather name="clipboard" size={20} color={C.accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Raport wizyty</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{stopName}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color={C.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Zamówienie / Wartość</Text>
            <View style={styles.orderRow}>
              <Feather name="shopping-bag" size={15} color={C.textTertiary} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, styles.orderInput]}
                placeholder="np. Zamówienie 3 500 zł, produkt XYZ"
                placeholderTextColor={C.textTertiary}
                value={orderValue}
                onChangeText={setOrderValue}
                returnKeyType="next"
                onSubmitEditing={() => noteRef.current?.focus()}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notatki ze spotkania</Text>
            <TextInput
              ref={noteRef}
              style={[styles.input, styles.noteInput]}
              placeholder="Co omówiono? Następne kroki, decyzje, uwagi klienta..."
              placeholderTextColor={C.textTertiary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleSkip}
              disabled={saving}
            >
              <Text style={styles.skipText}>Pomiń</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.saveBtn, saving && styles.btnDisabled, { opacity: pressed ? 0.85 : 1, flex: 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Zapisz i oznacz jako odwiedzona</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: C.textSecondary, marginBottom: 7, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  orderRow: { position: "relative" },
  fieldIcon: { position: "absolute", left: 14, top: 15, zIndex: 1 },
  input: {
    backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: "Inter_400Regular",
  },
  orderInput: { paddingLeft: 42 },
  noteInput: { minHeight: 100, textAlignVertical: "top" },
  buttons: { flexDirection: "row", gap: 10, marginTop: 8 },
  skipBtn: {
    paddingVertical: 15, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1.5,
    borderColor: C.border, alignItems: "center", justifyContent: "center",
  },
  skipText: { fontSize: 15, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  saveBtn: {
    backgroundColor: C.accent, borderRadius: 14, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
