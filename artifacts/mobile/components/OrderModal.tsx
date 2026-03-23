import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useClientsContext, type OrderItem } from "@/context/ClientsContext";

const C = Colors.light;

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface Props {
  visible: boolean;
  clientId: string;
  clientName: string;
  discount: number;
  onClose: () => void;
}

export function OrderModal({ visible, clientId, clientName, discount, onClose }: Props) {
  const { addOrder } = useClientsContext();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<OrderItem[]>([{ id: generateId(), name: "", quantity: 1, price: 0, unit: "szt." }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const UNITS = ["szt.", "kg", "l", "m", "opak.", "krt."];

  const addItem = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => [...prev, { id: generateId(), name: "", quantity: 1, price: 0, unit: "szt." }]);
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = async (id: string) => {
    if (items.length === 1) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((s, item) => s + item.quantity * item.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const handleSave = async () => {
    const validItems = items.filter((i) => i.name.trim() && i.price > 0);
    if (validItems.length === 0) {
      Alert.alert("Błąd", "Dodaj co najmniej jedną pozycję z nazwą i ceną.");
      return;
    }
    setSaving(true);
    try {
      await addOrder({
        clientId,
        items: validItems,
        total,
        status: "confirmed",
        notes: notes.trim() || undefined,
        discount,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      setItems([{ id: generateId(), name: "", quantity: 1, price: 0, unit: "szt." }]);
      setNotes("");
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Nowe zamówienie</Text>
              <Text style={styles.subtitle}>{clientName}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={C.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>POZYCJE ZAMÓWIENIA</Text>

            {items.map((item, idx) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNum}>#{idx + 1}</Text>
                  {items.length > 1 && (
                    <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                      <Feather name="trash-2" size={14} color={C.danger} />
                    </Pressable>
                  )}
                </View>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Nazwa produktu / usługi"
                  placeholderTextColor={C.textTertiary}
                  value={item.name}
                  onChangeText={(v) => updateItem(item.id, "name", v)}
                />
                <View style={styles.itemRow}>
                  <View style={styles.itemRowField}>
                    <Text style={styles.itemFieldLabel}>Ilość</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={String(item.quantity)}
                      onChangeText={(v) => updateItem(item.id, "quantity", parseFloat(v) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.itemRowField}>
                    <Text style={styles.itemFieldLabel}>Jednostka</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        {UNITS.map((u) => (
                          <Pressable key={u} style={[styles.unitChip, item.unit === u && styles.unitChipActive]} onPress={() => updateItem(item.id, "unit", u)}>
                            <Text style={[styles.unitText, item.unit === u && styles.unitTextActive]}>{u}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  <View style={styles.itemRowField}>
                    <Text style={styles.itemFieldLabel}>Cena (zł)</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={item.price > 0 ? String(item.price) : ""}
                      onChangeText={(v) => updateItem(item.id, "price", parseFloat(v) || 0)}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={C.textTertiary}
                    />
                  </View>
                  <View style={styles.itemRowField}>
                    <Text style={styles.itemFieldLabel}>Razem</Text>
                    <Text style={styles.itemTotal}>{(item.quantity * item.price).toLocaleString("pl-PL")} zł</Text>
                  </View>
                </View>
              </View>
            ))}

            <Pressable style={styles.addItemBtn} onPress={addItem}>
              <Feather name="plus" size={15} color={C.accent} />
              <Text style={styles.addItemText}>Dodaj pozycję</Text>
            </Pressable>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Wartość netto</Text>
                <Text style={styles.summaryValue}>{subtotal.toLocaleString("pl-PL")} zł</Text>
              </View>
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: C.success }]}>Rabat ({discount}%)</Text>
                  <Text style={[styles.summaryValue, { color: C.success }]}>-{discountAmount.toLocaleString("pl-PL")} zł</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Do zapłaty</Text>
                <Text style={styles.summaryTotalValue}>{total.toLocaleString("pl-PL")} zł</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>UWAGI DO ZAMÓWIENIA</Text>
            <TextInput
              style={[styles.nameInput, styles.notesInput]}
              placeholder="Specjalne wymagania, termin dostawy, warunki..."
              placeholderTextColor={C.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={{ height: 8 }} />
          </ScrollView>

          <Pressable style={({ pressed }) => [styles.saveBtn, saving && styles.btnDis, { opacity: pressed ? 0.85 : 1 }]} onPress={handleSave} disabled={saving}>
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Potwierdź zamówienie · {total.toLocaleString("pl-PL")} zł</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, color: C.textTertiary, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  form: { flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.textTertiary, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12, marginTop: 8 },
  itemCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, gap: 10 },
  itemHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemNum: { fontSize: 12, fontWeight: "700", color: C.textTertiary, fontFamily: "Inter_700Bold" },
  nameInput: { backgroundColor: C.backgroundTertiary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.text, fontFamily: "Inter_400Regular", borderWidth: 1, borderColor: C.borderLight },
  itemRow: { flexDirection: "row", gap: 8 },
  itemRowField: { flex: 1, gap: 4 },
  itemFieldLabel: { fontSize: 10, color: C.textTertiary, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.3 },
  smallInput: { backgroundColor: C.backgroundTertiary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, color: C.text, fontFamily: "Inter_400Regular", borderWidth: 1, borderColor: C.borderLight },
  unitChip: { paddingHorizontal: 8, paddingVertical: 8, borderRadius: 7, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  unitChipActive: { backgroundColor: "#EFF6FF", borderColor: C.accent },
  unitText: { fontSize: 11, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  unitTextActive: { color: C.accent, fontFamily: "Inter_600SemiBold" },
  itemTotal: { fontSize: 14, fontWeight: "700", color: "#8B5CF6", fontFamily: "Inter_700Bold", paddingTop: 8 },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.accent, borderRadius: 12, paddingVertical: 12, justifyContent: "center", marginBottom: 16 },
  addItemText: { fontSize: 14, color: C.accent, fontFamily: "Inter_600SemiBold" },
  summaryBox: { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, gap: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 14, color: C.text, fontFamily: "Inter_600SemiBold" },
  summaryTotal: { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  summaryTotalValue: { fontSize: 18, fontWeight: "700", color: "#8B5CF6", fontFamily: "Inter_700Bold" },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  saveBtn: {
    backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDis: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
