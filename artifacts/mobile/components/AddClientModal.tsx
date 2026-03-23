import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { useClientsContext, type Client } from "@/context/ClientsContext";
import type { Priority } from "@/context/RouteContext";

const C = Colors.light;

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "Wysoki", color: "#EF4444" },
  { value: "medium", label: "Średni", color: "#F59E0B" },
  { value: "low", label: "Niski", color: "#10B981" },
];

const PAYMENT_DAYS = [7, 14, 21, 30, 45, 60, 90];

interface Props {
  visible: boolean;
  onClose: () => void;
  prefill?: Partial<Client>;
  editClient?: Client;
  onSaved?: (client: Client) => void;
}

export function AddClientModal({ visible, onClose, prefill, editClient, onSaved }: Props) {
  const { addClient, updateClient } = useClientsContext();
  const insets = useSafeAreaInsets();
  const isEdit = !!editClient;

  const [name, setName] = useState(editClient?.name ?? prefill?.name ?? "");
  const [company, setCompany] = useState(editClient?.company ?? prefill?.company ?? "");
  const [address, setAddress] = useState(editClient?.address ?? prefill?.address ?? "");
  const [phone, setPhone] = useState(editClient?.phone ?? prefill?.phone ?? "");
  const [email, setEmail] = useState(editClient?.email ?? prefill?.email ?? "");
  const [nip, setNip] = useState(editClient?.nip ?? "");
  const [paymentDays, setPaymentDays] = useState(editClient?.paymentDays ?? 30);
  const [discount, setDiscount] = useState(String(editClient?.discount ?? "0"));
  const [creditLimit, setCreditLimit] = useState(String(editClient?.creditLimit ?? ""));
  const [currentDebt, setCurrentDebt] = useState(String(editClient?.currentDebt ?? ""));
  const [notes, setNotes] = useState(editClient?.notes ?? "");
  const [priority, setPriority] = useState<Priority>(editClient?.priority ?? prefill?.priority ?? "medium");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});

  const refs = {
    company: useRef<TextInput>(null),
    address: useRef<TextInput>(null),
    phone: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    nip: useRef<TextInput>(null),
  };

  const validate = () => {
    const e: { name?: string; address?: string } = {};
    if (!name.trim()) e.name = "Podaj nazwę lub imię i nazwisko";
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
      const data = {
        name: name.trim(),
        company: company.trim() || undefined,
        address: address.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        nip: nip.trim() || undefined,
        paymentDays,
        discount: parseFloat(discount) || 0,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        currentDebt: currentDebt ? parseFloat(currentDebt) : undefined,
        notes: notes.trim() || undefined,
        priority,
      };
      if (isEdit && editClient) {
        await updateClient(editClient.id, data);
        onSaved?.({ ...editClient, ...data });
      } else {
        const client = await addClient(data);
        onSaved?.(client);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? "Edytuj klienta" : "Nowy klient"}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={C.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <SectionLabel text="DANE PODSTAWOWE" />
            <Field label="Nazwa / Imię i nazwisko *" error={errors.name}>
              <TextInput style={[styles.input, errors.name && styles.inputError]} placeholder="Jan Kowalski" placeholderTextColor={C.textTertiary}
                value={name} onChangeText={(t) => { setName(t); setErrors((p) => ({ ...p, name: undefined })); }} autoFocus returnKeyType="next" onSubmitEditing={() => refs.company.current?.focus()} />
            </Field>
            <Field label="Firma">
              <TextInput ref={refs.company} style={styles.input} placeholder="ABC Sp. z o.o." placeholderTextColor={C.textTertiary}
                value={company} onChangeText={setCompany} returnKeyType="next" onSubmitEditing={() => refs.address.current?.focus()} />
            </Field>
            <Field label="Adres *" error={errors.address}>
              <TextInput ref={refs.address} style={[styles.input, styles.inputMulti, errors.address && styles.inputError]} placeholder="ul. Przykładowa 1, Warszawa"
                placeholderTextColor={C.textTertiary} value={address} onChangeText={(t) => { setAddress(t); setErrors((p) => ({ ...p, address: undefined })); }} multiline />
            </Field>

            <SectionLabel text="KONTAKT" />
            <Field label="Telefon">
              <View style={styles.iconInput}>
                <Feather name="phone" size={15} color={C.textTertiary} style={styles.fieldIcon} />
                <TextInput ref={refs.phone} style={[styles.input, styles.withIcon]} placeholder="+48 123 456 789" placeholderTextColor={C.textTertiary}
                  value={phone} onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" onSubmitEditing={() => refs.email.current?.focus()} />
              </View>
            </Field>
            <Field label="E-mail">
              <View style={styles.iconInput}>
                <Feather name="mail" size={15} color={C.textTertiary} style={styles.fieldIcon} />
                <TextInput ref={refs.email} style={[styles.input, styles.withIcon]} placeholder="jan@firma.pl" placeholderTextColor={C.textTertiary}
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => refs.nip.current?.focus()} />
              </View>
            </Field>
            <Field label="NIP">
              <TextInput ref={refs.nip} style={styles.input} placeholder="1234567890" placeholderTextColor={C.textTertiary}
                value={nip} onChangeText={setNip} keyboardType="numeric" />
            </Field>

            <SectionLabel text="WARUNKI HANDLOWE" />
            <Field label="Priorytet klienta">
              <View style={styles.row3}>
                {PRIORITIES.map((p) => (
                  <Pressable key={p.value} style={[styles.chip, priority === p.value && { backgroundColor: p.color + "18", borderColor: p.color }]}
                    onPress={async () => { await Haptics.selectionAsync(); setPriority(p.value); }}>
                    <Text style={[styles.chipText, priority === p.value && { color: p.color, fontFamily: "Inter_600SemiBold" }]}>{p.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
            <Field label="Termin płatności">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.rowGap}>
                  {PAYMENT_DAYS.map((d) => (
                    <Pressable key={d} style={[styles.dayChip, paymentDays === d && styles.dayChipActive]}
                      onPress={async () => { await Haptics.selectionAsync(); setPaymentDays(d); }}>
                      <Text style={[styles.dayChipText, paymentDays === d && styles.dayChipTextActive]}>{d} dni</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Field>
            <View style={styles.row2}>
              <Field label="Rabat (%)" style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor={C.textTertiary}
                  value={discount} onChangeText={setDiscount} keyboardType="numeric" />
              </Field>
              <Field label="Limit kredytowy (zł)" style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="np. 10000" placeholderTextColor={C.textTertiary}
                  value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" />
              </Field>
            </View>
            <Field label="Zaległość (zł)">
              <View style={styles.iconInput}>
                <Feather name="alert-triangle" size={15} color={C.warning} style={styles.fieldIcon} />
                <TextInput style={[styles.input, styles.withIcon]} placeholder="0" placeholderTextColor={C.textTertiary}
                  value={currentDebt} onChangeText={setCurrentDebt} keyboardType="numeric" />
              </View>
            </Field>

            <SectionLabel text="NOTATKI" />
            <Field label="Notatki o kliencie">
              <TextInput style={[styles.input, styles.inputNote]} placeholder="Warunki szczególne, preferencje, kontakty dodatkowe..."
                placeholderTextColor={C.textTertiary} value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" />
            </Field>
            <View style={{ height: 8 }} />
          </ScrollView>

          <Pressable style={({ pressed }) => [styles.saveBtn, saving && styles.btnDis, { opacity: pressed ? 0.85 : 1 }]} onPress={handleSave} disabled={saving}>
            <Feather name={isEdit ? "save" : "user-plus"} size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{isEdit ? "Zapisz zmiany" : "Dodaj klienta"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function Field({ label, error, children, style }: { label: string; error?: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  form: { flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.textTertiary, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 8, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: C.textSecondary, marginBottom: 6, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3, textTransform: "uppercase" },
  input: { backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: "Inter_400Regular" },
  inputMulti: { minHeight: 64, textAlignVertical: "top" },
  inputNote: { minHeight: 90, textAlignVertical: "top" },
  inputError: { borderColor: C.danger },
  withIcon: { paddingLeft: 42, flex: 1 },
  iconInput: { position: "relative" },
  fieldIcon: { position: "absolute", left: 14, top: 15, zIndex: 1 },
  errorText: { fontSize: 12, color: C.danger, marginTop: 4, fontFamily: "Inter_400Regular" },
  row2: { flexDirection: "row", gap: 10 },
  row3: { flexDirection: "row", gap: 8 },
  rowGap: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, alignItems: "center" },
  chipText: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  dayChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  dayChipActive: { backgroundColor: "#EFF6FF", borderColor: C.accent },
  dayChipText: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  dayChipTextActive: { color: C.accent, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDis: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
