import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
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
import { useRouteContext, type Priority } from "@/context/RouteContext";
import { useClientsContext, type Client } from "@/context/ClientsContext";

const C = Colors.light;

const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: "high", label: "Wysoki", color: "#EF4444", bg: "#FEF2F2" },
  { value: "medium", label: "Średni", color: "#F59E0B", bg: "#FFFBEB" },
  { value: "low", label: "Niski", color: "#10B981", bg: "#ECFDF5" },
];

function ClientPickerModal({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (c: Client) => void }) {
  const { clients } = useClientsContext();
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={pickerStyles.container}>
        <View style={pickerStyles.header}>
          <Text style={pickerStyles.title}>Wybierz klienta z CRM</Text>
          <Pressable style={pickerStyles.closeBtn} onPress={onClose} hitSlop={8}>
            <Feather name="x" size={20} color={C.textSecondary} />
          </Pressable>
        </View>
        <View style={pickerStyles.searchBox}>
          <Feather name="search" size={15} color={C.textTertiary} />
          <TextInput
            style={pickerStyles.searchInput}
            placeholder="Szukaj klienta..."
            placeholderTextColor={C.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled">
          {filtered.length === 0 && (
            <View style={pickerStyles.empty}>
              <Text style={pickerStyles.emptyText}>{clients.length === 0 ? "Brak klientów w CRM. Dodaj klientów w zakładce Klienci." : "Brak wyników."}</Text>
            </View>
          )}
          {filtered.map((c) => (
            <Pressable
              key={c.id}
              style={({ pressed }) => [pickerStyles.clientRow, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { onSelect(c); onClose(); setSearch(""); }}
            >
              <View style={pickerStyles.avatar}>
                <Text style={pickerStyles.avatarText}>{c.name.charAt(0)}</Text>
              </View>
              <View style={pickerStyles.clientInfo}>
                <Text style={pickerStyles.clientName}>{c.name}</Text>
                {c.company && <Text style={pickerStyles.clientCompany}>{c.company}</Text>}
                <Text style={pickerStyles.clientAddress} numberOfLines={1}>{c.address}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textTertiary} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

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
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [selectedClientName, setSelectedClientName] = useState<string | undefined>();

  const addressRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const handleClientSelect = (client: Client) => {
    setName(client.name + (client.company ? ` (${client.company})` : ""));
    setAddress(client.address);
    setPhone(client.phone ?? "");
    setPriority(client.priority);
    setSelectedClientId(client.id);
    setSelectedClientName(client.name);
    setErrors({});
  };

  const clearClient = () => {
    setSelectedClientId(undefined);
    setSelectedClientName(undefined);
    setName("");
    setAddress("");
    setPhone("");
  };

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
        clientId: selectedClientId,
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
          {selectedClientId ? (
            <View style={styles.linkedClient}>
              <View style={styles.linkedClientIcon}>
                <Feather name="user-check" size={16} color={C.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkedClientLabel}>Klient z CRM</Text>
                <Text style={styles.linkedClientName}>{selectedClientName}</Text>
              </View>
              <Pressable onPress={clearClient} hitSlop={8}>
                <Feather name="x" size={16} color={C.textTertiary} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.crmBtn} onPress={() => setPickerVisible(true)}>
              <Feather name="users" size={15} color={C.accent} />
              <Text style={styles.crmBtnText}>Wybierz z bazy klientów (CRM)</Text>
              <Feather name="chevron-right" size={15} color={C.accent} />
            </Pressable>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>lub wypełnij ręcznie</Text>
            <View style={styles.divLine} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nazwa klienta *</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="np. Jan Kowalski / ABC Sp. z o.o."
              placeholderTextColor={C.textTertiary}
              value={name}
              onChangeText={(t) => { setName(t); setErrors((p) => ({ ...p, name: undefined })); }}
              autoFocus={!selectedClientId}
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
            <View style={styles.phoneContainer}>
              <Feather name="phone" size={15} color={C.textTertiary} style={styles.phoneIcon} />
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
                  onPress={async () => { await Haptics.selectionAsync(); setPriority(p.value); }}
                >
                  <Text style={[styles.priorityText, priority === p.value && { color: p.color, fontFamily: "Inter_600SemiBold" }]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notatka przed wizytą</Text>
            <TextInput
              ref={noteRef}
              style={[styles.input, styles.inputNote]}
              placeholder="np. kod do klatki: 1234, zapytać o zamówienie"
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

      <ClientPickerModal visible={pickerVisible} onClose={() => setPickerVisible(false)} onSelect={handleClientSelect} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  form: { flex: 1 },
  crmBtn: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#EFF6FF",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: "#BFDBFE", marginBottom: 16,
  },
  crmBtnText: { flex: 1, fontSize: 14, color: C.accent, fontFamily: "Inter_600SemiBold" },
  linkedClient: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ECFDF5",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: "#A7F3D0", marginBottom: 16,
  },
  linkedClientIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center" },
  linkedClientLabel: { fontSize: 10, color: C.success, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3, textTransform: "uppercase" },
  linkedClientName: { fontSize: 14, color: C.text, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { fontSize: 12, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", color: C.textSecondary, marginBottom: 7, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  input: { backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: "Inter_400Regular" },
  inputMulti: { minHeight: 66, textAlignVertical: "top" },
  inputNote: { minHeight: 80, textAlignVertical: "top" },
  inputError: { borderColor: C.danger },
  errorText: { fontSize: 12, color: C.danger, marginTop: 4, fontFamily: "Inter_400Regular" },
  phoneContainer: { position: "relative" },
  phoneIcon: { position: "absolute", left: 16, top: 15, zIndex: 1 },
  phoneInput: { paddingLeft: 44 },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, alignItems: "center" },
  priorityText: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  saveBtn: {
    backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});

const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 15, color: C.text, fontFamily: "Inter_400Regular" },
  empty: { paddingTop: 40, alignItems: "center", paddingHorizontal: 24 },
  emptyText: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  avatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: "700", color: C.accent, fontFamily: "Inter_700Bold" },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  clientCompany: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  clientAddress: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular" },
});
