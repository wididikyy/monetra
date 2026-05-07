import { useEffect, useState } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, Theme } from '@/constants/theme';
import { clearAllCache } from '@/db/ai-cache';
import { deleteAllAnggaran } from '@/db/anggaran';
import { getAllKategori } from '@/db/kategori';
import { getProfil, saveProfil } from '@/db/profil';
import { deleteAllTransaksi } from '@/db/transaksi';
import { deleteApiKey, getApiKey, saveApiKey } from '@/services/ai-service';
import { useAppStore } from '@/store/use-app-store';
import Constants from 'expo-constants';

export default function PengaturanScreen() {
  const { profil, setProfil, setKategoriList, triggerRefresh } = useAppStore();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const [namaProfil, setNamaProfil] = useState(profil?.nama ?? '');
  const [penghasilan, setPenghasilan] = useState(
    profil?.penghasilan_bulanan ? String(profil.penghasilan_bulanan) : ''
  );

  useEffect(() => {
    getApiKey().then((k) => { if (k) setApiKey(k); });
  }, []);

  async function handleSaveApiKey() {
    if (!apiKey.trim()) {
      Alert.alert('Perhatian', 'API key tidak boleh kosong.');
      return;
    }
    setSavingKey(true);
    try {
      await saveApiKey(apiKey.trim());
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    } finally {
      setSavingKey(false);
    }
  }

  async function handleDeleteApiKey() {
    Alert.alert('Hapus API Key', 'Yakin ingin menghapus API key?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await deleteApiKey();
          setApiKey('');
        },
      },
    ]);
  }

  async function handleSaveProfil() {
    if (!namaProfil.trim()) {
      Alert.alert('Perhatian', 'Nama tidak boleh kosong.');
      return;
    }
    const nominal = parseFloat(penghasilan.replace(/\D/g, '')) || 0;
    await saveProfil(namaProfil.trim(), profil?.mata_uang ?? 'IDR', nominal);
    const updated = await getProfil();
    setProfil(updated);
    Alert.alert('Tersimpan', 'Profil berhasil diperbarui.');
  }

  async function handleClearCache() {
    Alert.alert('Hapus Cache AI', 'Semua cache respons AI akan dihapus.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await clearAllCache();
          Alert.alert('Selesai', 'Cache AI berhasil dihapus.');
        },
      },
    ]);
  }

  async function handleResetData() {
    Alert.alert(
      'Reset Semua Data',
      'Semua transaksi dan anggaran akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lanjutkan', style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Konfirmasi Terakhir',
              'Yakin ingin menghapus semua data?',
              [
                { text: 'Tidak', style: 'cancel' },
                {
                  text: 'Ya, Hapus Semua', style: 'destructive',
                  onPress: async () => {
                    await Promise.all([deleteAllTransaksi(), deleteAllAnggaran(), clearAllCache()]);
                    const kategori = await getAllKategori();
                    setKategoriList(kategori);
                    triggerRefresh();
                    Alert.alert('Selesai', 'Semua data berhasil dihapus.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profil section */}
        <Text style={[styles.groupLabel, { color: Theme.subtext }]}>PROFIL</Text>
        <View style={[styles.card, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
          <Text style={[styles.fieldLabel, { color: Theme.text }]}>Nama</Text>
          <TextInput
            style={[styles.input, { backgroundColor: Theme.background, color: Theme.text, borderColor: Theme.border }]}
            value={namaProfil}
            onChangeText={setNamaProfil}
            placeholder="Nama kamu"
            placeholderTextColor={Theme.subtext}
          />
          <Text style={[styles.fieldLabel, { color: Theme.text }]}>Penghasilan Bulanan</Text>
          <TextInput
            style={[styles.input, { backgroundColor: Theme.background, color: Theme.text, borderColor: Theme.border }]}
            value={penghasilan}
            onChangeText={setPenghasilan}
            placeholder="Contoh: 5000000"
            placeholderTextColor={Theme.subtext}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: AppColors.primary }]}
            onPress={handleSaveProfil}
          >
            <Text style={styles.btnText}>Simpan Profil</Text>
          </TouchableOpacity>
        </View>

        {/* AI API Key */}
        <Text style={[styles.groupLabel, { color: Theme.subtext }]}>GROQ API KEY</Text>
        <View style={[styles.card, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
          <Text style={[styles.hint, { color: Theme.subtext }]}>
            Diperlukan untuk fitur Asisten AI. Dapatkan gratis di console.groq.com.
          </Text>
          <View style={styles.keyInputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex, { backgroundColor: Theme.background, color: Theme.text, borderColor: Theme.border }]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="gsk_..."
              placeholderTextColor={Theme.subtext}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey((v) => !v)}>
              <IconSymbol name={showKey ? 'eye.slash.fill' : 'eye.fill'} size={20} color={Theme.subtext} />
            </TouchableOpacity>
          </View>
          <View style={styles.keyActions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnFlex, { backgroundColor: keySaved ? AppColors.income : AppColors.primary }]}
              onPress={handleSaveApiKey}
              disabled={savingKey}
            >
              {savingKey ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnText}>{keySaved ? 'Tersimpan!' : 'Simpan API Key'}</Text>
              )}
            </TouchableOpacity>
            {apiKey.length > 0 && (
              <TouchableOpacity
                style={[styles.btn, styles.btnFlex, { backgroundColor: AppColors.expense }]}
                onPress={handleDeleteApiKey}
              >
                <Text style={styles.btnText}>Hapus</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Data management */}
        <Text style={[styles.groupLabel, { color: Theme.subtext }]}>DATA</Text>
        <View style={[styles.card, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleClearCache}>
            <View style={[styles.menuIcon, { backgroundColor: `${AppColors.warning}20` }]}>
              <IconSymbol name="sparkles" size={18} color={AppColors.warning} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: Theme.text }]}>Hapus Cache AI</Text>
              <Text style={[styles.menuSubtitle, { color: Theme.subtext }]}>Respons AI tersimpan akan dihapus</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={Theme.subtext} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: Theme.border }]} />

          <TouchableOpacity style={styles.menuItem} onPress={handleResetData}>
            <View style={[styles.menuIcon, { backgroundColor: `${AppColors.expense}20` }]}>
              <IconSymbol name="trash.fill" size={18} color={AppColors.expense} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: AppColors.expense }]}>Reset Semua Data</Text>
              <Text style={[styles.menuSubtitle, { color: Theme.subtext }]}>Hapus semua transaksi dan anggaran</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={Theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* App info */}
        <Text style={[styles.groupLabel, { color: Theme.subtext }]}>INFO</Text>
        <View style={[styles.card, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: Theme.subtext }]}>Versi</Text>
            <Text style={[styles.infoValue, { color: Theme.text }]}>{version}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: Theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: Theme.subtext }]}>Penyimpanan</Text>
            <Text style={[styles.infoValue, { color: Theme.text }]}>Lokal (SQLite)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 8 },
  groupLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  fieldLabel: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  inputFlex: { flex: 1 },
  keyInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },
  keyActions: { flexDirection: 'row', gap: 8 },
  btn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnFlex: { flex: 1 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuInfo: { flex: 1, gap: 2 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 12 },
  divider: { height: 1, marginVertical: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
});
