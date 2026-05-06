/* eslint-disable @typescript-eslint/no-unused-vars */
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransaksiCard } from '@/components/transaksi-card';
import { AppColors, Theme } from '@/constants/theme';
import { getKategoriByTipe, Kategori } from '@/db/kategori';
import {
  addTransaksi,
  getTransaksiByBulan,
  Transaksi,
} from '@/db/transaksi';
import { useAppStore } from '@/store/use-app-store';
import { getISODate, getNamaBulan } from '@/utils/format';


export default function TransaksiScreen() {
  const { tipe: paramTipe } = useLocalSearchParams<{ tipe?: string }>();

  const { selectedBulan, selectedTahun, setSelectedBulan, refreshCounter, triggerRefresh, dbReady } = useAppStore();

  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formTipe, setFormTipe] = useState<'masuk' | 'keluar'>('keluar');
  const [jumlah, setJumlah] = useState('');
  const [catatan, setCatatan] = useState('');
  const [tanggal, setTanggal] = useState(getISODate());
  const [selectedKategori, setSelectedKategori] = useState<Kategori | null>(null);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [saving, setSaving] = useState(false);

  const loadTransaksi = useCallback(async () => {
    if (!dbReady) return;
    setLoading(true);
    try {
      const list = await getTransaksiByBulan(selectedBulan, selectedTahun);
      setTransaksiList(list);
    } finally {
      setLoading(false);
    }
  }, [dbReady, selectedBulan, selectedTahun]);

  useEffect(() => { loadTransaksi(); }, [loadTransaksi, refreshCounter]);

  useEffect(() => {
    if (paramTipe === 'masuk' || paramTipe === 'keluar') {
      setFormTipe(paramTipe);
      setShowForm(true);
    }
  }, [paramTipe]);

  useEffect(() => {
    getKategoriByTipe(formTipe).then((list) => {
      setKategoriList(list);
      setSelectedKategori(null);
    });
  }, [formTipe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransaksi();
    setRefreshing(false);
  }, [loadTransaksi]);

  function navigateBulan(delta: number) {
    let b = selectedBulan + delta;
    let t = selectedTahun;
    if (b < 1) { b = 12; t -= 1; }
    if (b > 12) { b = 1; t += 1; }
    setSelectedBulan(b, t);
  }

  async function handleSave() {
    if (!jumlah || parseFloat(jumlah.replace(/\D/g, '')) <= 0) {
      Alert.alert('Perhatian', 'Masukkan jumlah yang valid.');
      return;
    }
    if (!selectedKategori) {
      Alert.alert('Perhatian', 'Pilih kategori terlebih dahulu.');
      return;
    }
    setSaving(true);
    try {
      await addTransaksi(
        parseFloat(jumlah.replace(/\D/g, '')),
        formTipe,
        selectedKategori.id,
        catatan.trim() || null,
        tanggal,
      );
      triggerRefresh();
      setShowForm(false);
      resetForm();
      await loadTransaksi();
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan transaksi.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setJumlah('');
    setCatatan('');
    setTanggal(getISODate());
    setSelectedKategori(null);
  }

  // Group transactions by date
  const grouped: Record<string, Transaksi[]> = {};
  for (const tx of transaksiList) {
    if (!grouped[tx.tanggal]) grouped[tx.tanggal] = [];
    grouped[tx.tanggal].push(tx);
  }
  const groupedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Theme.background }]} edges={[]}>
      {/* Month navigation */}
      <View style={[styles.monthNav, { backgroundColor: Theme.card, borderBottomColor: Theme.border }]}>
        <TouchableOpacity onPress={() => navigateBulan(-1)} style={styles.navBtn}>
          <IconSymbol name="chevron.left" size={20} color={Theme.text} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: Theme.text }]}>
          {getNamaBulan(selectedBulan)} {selectedTahun}
        </Text>
        <TouchableOpacity onPress={() => navigateBulan(1)} style={styles.navBtn}>
          <IconSymbol name="chevron.right" size={20} color={Theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeleton, { backgroundColor: Theme.skeleton }]} />
          ))
        ) : transaksiList.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tray.fill" size={56} color={Theme.subtext} />
            <Text style={[styles.emptyTitle, { color: Theme.text }]}>Belum ada transaksi</Text>
            <Text style={[styles.emptySubtitle, { color: Theme.subtext }]}>
              Tekan tombol + untuk mencatat transaksi baru
            </Text>
          </View>
        ) : (
          groupedDates.map((date) => (
            <View key={date}>
              <Text style={[styles.dateHeader, { color: Theme.subtext }]}>
                {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              {grouped[date].map((tx) => (
                <TransaksiCard key={tx.id} transaksi={tx} onDelete={loadTransaksi} />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: AppColors.primary }]}
        onPress={() => { setFormTipe('keluar'); setShowForm(true); }}
      >
        <IconSymbol name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView style={[styles.modal, { backgroundColor: Theme.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: Theme.border }]}>
            <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
              <Text style={[styles.modalCancel, { color: AppColors.primary }]}>Batal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: Theme.text }]}>Tambah Transaksi</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, { color: AppColors.primary, opacity: saving ? 0.5 : 1 }]}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            {/* Tipe toggle */}
            <View style={[styles.tipeToggle, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
              {(['keluar', 'masuk'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tipeBtn,
                    formTipe === t && {
                      backgroundColor: t === 'masuk' ? AppColors.income : AppColors.expense,
                    },
                  ]}
                  onPress={() => setFormTipe(t)}
                >
                  <Text style={[
                    styles.tipeBtnText,
                    { color: formTipe === t ? '#fff' : Theme.subtext },
                  ]}>
                    {t === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text style={[styles.fieldLabel, { color: Theme.text }]}>Jumlah</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Theme.card, color: Theme.text, borderColor: Theme.border }]}
              placeholder="0"
              placeholderTextColor={Theme.subtext}
              value={jumlah}
              onChangeText={setJumlah}
              keyboardType="numeric"
              autoFocus
            />

            {/* Kategori */}
            <Text style={[styles.fieldLabel, { color: Theme.text }]}>Kategori</Text>
            <View style={styles.kategoriGrid}>
              {kategoriList.map((k) => (
                <TouchableOpacity
                  key={k.id}
                  style={[
                    styles.kategoriChip,
                    { backgroundColor: Theme.card, borderColor: Theme.border },
                    selectedKategori?.id === k.id && { borderColor: k.warna, backgroundColor: `${k.warna}15` },
                  ]}
                  onPress={() => setSelectedKategori(k)}
                >
                  <IconSymbol name={k.ikon as IconSymbolName} size={18} color={k.warna} />
                  <Text style={[styles.kategoriChipText, { color: Theme.text }]} numberOfLines={1}>
                    {k.nama}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tanggal */}
            <Text style={[styles.fieldLabel, { color: Theme.text }]}>Tanggal</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Theme.card, color: Theme.text, borderColor: Theme.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Theme.subtext}
              value={tanggal}
              onChangeText={setTanggal}
            />

            {/* Catatan */}
            <Text style={[styles.fieldLabel, { color: Theme.text }]}>Catatan <Text style={{ color: Theme.subtext }}>(opsional)</Text></Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: Theme.card, color: Theme.text, borderColor: Theme.border }]}
              placeholder="Tambahkan catatan..."
              placeholderTextColor={Theme.subtext}
              value={catatan}
              onChangeText={setCatatan}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  navBtn: { padding: 4 },
  monthText: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 100 },
  dateHeader: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  skeleton: { height: 64, borderRadius: 12, marginBottom: 8 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalSave: { fontSize: 16, fontWeight: '600' },
  formScroll: { padding: 20, gap: 4, paddingBottom: 40 },
  tipeToggle: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    overflow: 'hidden', marginBottom: 16,
  },
  tipeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tipeBtnText: { fontSize: 15, fontWeight: '600' },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  kategoriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kategoriChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
  },
  kategoriChipText: { fontSize: 13, fontWeight: '500' },
});
