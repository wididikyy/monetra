import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnggaranProgress } from '@/components/anggaran-progress';
import { TransaksiCard } from '@/components/transaksi-card';
import { AppColors, Theme } from '@/constants/theme';
import { buildCacheKey, getCache, saveCache } from '@/db/ai-cache';
import { Anggaran, getAnggaranByBulan } from '@/db/anggaran';
import { getSummaryByBulan, getTransaksiByBulan, Transaksi } from '@/db/transaksi';
import { callAI } from '@/services/ai-service';
import { buildFinancialContext } from '@/services/context-builder';
import { useAppStore } from '@/store/use-app-store';
import { formatRupiah, getNamaBulan } from '@/utils/format';

export default function DashboardScreen() {
  const { selectedBulan, selectedTahun, refreshCounter, isOnline, dbReady } = useAppStore();

  const [summary, setSummary] = useState({ total_masuk: 0, total_keluar: 0 });
  const [recentTransaksi, setRecentTransaksi] = useState<Transaksi[]>([]);
  const [anggaranList, setAnggaranList] = useState<Anggaran[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!dbReady) return;
    setLoading(true);
    try {
      const [s, tx, ang] = await Promise.all([
        getSummaryByBulan(selectedBulan, selectedTahun),
        getTransaksiByBulan(selectedBulan, selectedTahun),
        getAnggaranByBulan(selectedBulan, selectedTahun),
      ]);
      setSummary(s);
      setRecentTransaksi(tx.slice(0, 5));
      setAnggaranList(ang);
    } finally {
      setLoading(false);
    }
  }, [dbReady, selectedBulan, selectedTahun]);

  const loadAiInsight = useCallback(async () => {
    const key = buildCacheKey('insight_harian', selectedBulan, selectedTahun);
    const cached = await getCache(key);
    if (cached) {
      setAiInsight(cached.respons);
      return;
    }
    if (!isOnline) return;

    setAiLoading(true);
    try {
      const ctx = await buildFinancialContext();
      const resp = await callAI(
        'Berikan insight singkat tentang kondisi keuangan saya bulan ini dan satu saran penghematan.',
        ctx
      );
      await saveCache(key, resp, `${selectedBulan}-${selectedTahun}`);
      setAiInsight(resp);
    } catch {
      // silent fail — insight is optional
    } finally {
      setAiLoading(false);
    }
  }, [isOnline, selectedBulan, selectedTahun]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshCounter]);

  useEffect(() => {
    if (dbReady) loadAiInsight();
  }, [dbReady, loadAiInsight]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const saldo = summary.total_masuk - summary.total_keluar;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Theme.background }]} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: Theme.card }]}>
          <Text style={styles.balanceLabel}>Saldo Bersih · {getNamaBulan(selectedBulan)} {selectedTahun}</Text>
          <Text style={styles.balanceAmount}>
            {loading ? '—' : formatRupiah(saldo)}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceItemIcon}>
                <IconSymbol name="arrow.down" size={14} color={AppColors.income} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Pemasukan</Text>
                <Text style={styles.balanceItemValue}>{loading ? '—' : formatRupiah(summary.total_masuk)}</Text>
              </View>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <View style={[styles.balanceItemIcon, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                <IconSymbol name="arrow.up" size={14} color={AppColors.expense} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Pengeluaran</Text>
                <Text style={[styles.balanceItemValue, {color: AppColors.expense}]}>{loading ? '—' : formatRupiah(summary.total_keluar)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: AppColors.income }]}
            onPress={() => router.push({ pathname: '/(tabs)/transaksi', params: { tipe: 'masuk' } })}
          >
            <IconSymbol name="plus" size={18} color="#fff" />
            <Text style={styles.quickBtnText}>Pemasukan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: AppColors.expense }]}
            onPress={() => router.push({ pathname: '/(tabs)/transaksi', params: { tipe: 'keluar' } })}
          >
            <IconSymbol name="minus" size={18} color="#fff" />
            <Text style={styles.quickBtnText}>Pengeluaran</Text>
          </TouchableOpacity>
        </View>

        {/* AI Insight */}
        <View style={[styles.section, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="sparkles" size={18} color={AppColors.primary} />
            <Text style={[styles.sectionTitle, { color: Theme.text }]}>Insight AI</Text>
          </View>
          {aiLoading ? (
            <View style={[styles.skeleton, { backgroundColor: Theme.skeleton }]} />
          ) : aiInsight ? (
            <Text style={[styles.aiText, { color: Theme.subtext }]}>{aiInsight}</Text>
          ) : (
            <Text style={[styles.aiText, { color: Theme.subtext }]}>
              {isOnline
                ? 'Tambahkan Groq API key di Pengaturan untuk mendapatkan insight AI.'
                : 'Butuh koneksi internet untuk insight AI.'}
            </Text>
          )}
        </View>

        {/* Anggaran Progress */}
        {anggaranList.length > 0 && (
          <View style={[styles.section, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="chart.pie.fill" size={18} color={AppColors.primary} />
              <Text style={[styles.sectionTitle, { color: Theme.text }]}>Anggaran</Text>
            </View>
            {anggaranList.map((ang) => (
              <AnggaranProgress key={ang.id} anggaran={ang} />
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={[styles.section, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
          <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol name="clock.fill" size={18} color={AppColors.primary} />
              <Text style={[styles.sectionTitle, { color: Theme.text }]}>Transaksi Terbaru</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/transaksi')}>
              <Text style={[styles.seeAll, { color: AppColors.primary }]}>Lihat semua</Text>
            </Pressable>
          </View>

          {loading ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeleton, { backgroundColor: Theme.skeleton, marginBottom: 8 }]} />
            ))
          ) : recentTransaksi.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="tray.fill" size={40} color={Theme.subtext} />
              <Text style={[styles.emptyText, { color: Theme.subtext }]}>Belum ada transaksi bulan ini</Text>
            </View>
          ) : (
            recentTransaksi.map((tx) => (
              <TransaksiCard key={tx.id} transaksi={tx} onDelete={loadData} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  balanceCard: {
    borderRadius: 20, padding: 20,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  balanceLabel: { color: Theme.text, fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: Theme.text, fontSize: 34, fontWeight: '800', marginBottom: 20 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceItemIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  balanceItemLabel: { color: Theme.text, fontSize: 12 },
  balanceItemValue: { color: AppColors.income, fontSize: 15, fontWeight: '600' },
  balanceDivider: { width: 1, height: 32, backgroundColor: 'rgba(0, 0, 0, 0.2)', marginHorizontal: 12 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  quickBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  section: {
    borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionHeaderSpaced: { justifyContent: 'space-between' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '500' },
  aiText: { fontSize: 14, lineHeight: 22 },
  skeleton: { height: 48, borderRadius: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyText: { fontSize: 14 },
});
