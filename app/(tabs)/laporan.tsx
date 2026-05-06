import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GrafikPengeluaran } from '@/components/grafik-pengeluaran';
import { AppColors, Colors } from '@/constants/theme';
import {
  getSummaryByBulan,
  getTopKategoriByBulan, getTrenBulanan,
  KategoriSpend,
} from '@/db/transaksi';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/store/use-app-store';
import { formatRupiah, getNamaBulan } from '@/utils/format';

type TrenItem = { bulan: number; tahun: number; total_masuk: number; total_keluar: number };

export default function LaporanScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { selectedBulan, selectedTahun, setSelectedBulan, refreshCounter, dbReady } = useAppStore();

  const [topKategori, setTopKategori] = useState<KategoriSpend[]>([]);
  const [tren, setTren] = useState<TrenItem[]>([]);
  const [summary, setSummary] = useState({ total_masuk: 0, total_keluar: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!dbReady) return;
    setLoading(true);
    try {
      const [top, trenData, s] = await Promise.all([
        getTopKategoriByBulan(selectedBulan, selectedTahun, 9),
        getTrenBulanan(6),
        getSummaryByBulan(selectedBulan, selectedTahun),
      ]);
      setTopKategori(top);
      setTren(trenData);
      setSummary(s);
    } finally {
      setLoading(false);
    }
  }, [dbReady, selectedBulan, selectedTahun]);

  useEffect(() => { loadData(); }, [loadData, refreshCounter]);

  function navigateBulan(delta: number) {
    let b = selectedBulan + delta;
    let t = selectedTahun;
    if (b < 1) { b = 12; t -= 1; }
    if (b > 12) { b = 1; t += 1; }
    setSelectedBulan(b, t);
  }

  const totalKeluar = summary.total_keluar;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={[]}>
      {/* Month navigation */}
      <View style={[styles.monthNav, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigateBulan(-1)} style={styles.navBtn}>
          <IconSymbol name="chevron.left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.text }]}>
          {getNamaBulan(selectedBulan)} {selectedTahun}
        </Text>
        <TouchableOpacity onPress={() => navigateBulan(1)} style={styles.navBtn}>
          <IconSymbol name="chevron.right" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: AppColors.incomeLight }]}>
            <Text style={[styles.summaryLabel, { color: AppColors.income }]}>Pemasukan</Text>
            <Text style={[styles.summaryValue, { color: AppColors.income }]}>
              {formatRupiah(summary.total_masuk)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: AppColors.expenseLight }]}>
            <Text style={[styles.summaryLabel, { color: AppColors.expense }]}>Pengeluaran</Text>
            <Text style={[styles.summaryValue, { color: AppColors.expense }]}>
              {formatRupiah(summary.total_keluar)}
            </Text>
          </View>
        </View>

        {/* Donut chart: pengeluaran per kategori */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Pengeluaran per Kategori</Text>
          {loading ? (
            <View style={[styles.skeleton, { backgroundColor: theme.skeleton }]} />
          ) : topKategori.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="chart.pie" size={40} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>Belum ada data pengeluaran</Text>
            </View>
          ) : (
            <GrafikPengeluaran data={topKategori} />
          )}
        </View>

        {/* Category breakdown table */}
        {topKategori.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Rincian Kategori</Text>
            {topKategori.map((k, index) => {
              const persen = totalKeluar > 0 ? (k.total / totalKeluar) * 100 : 0;
              return (
                <View key={k.kategori_id} style={[styles.kategoriRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.kategoriLeft}>
                    <Text style={[styles.rankNum, { color: theme.subtext }]}>{index + 1}</Text>
                    <View style={[styles.kategoriDot, { backgroundColor: k.kategori_warna }]} />
                    <View style={[styles.kategoriIconBox, { backgroundColor: `${k.kategori_warna}20` }]}>
                      <IconSymbol name={k.kategori_ikon as IconSymbolName} size={14} color={k.kategori_warna} />
                    </View>
                    <Text style={[styles.kategoriNama, { color: theme.text }]}>{k.kategori_nama}</Text>
                  </View>
                  <View style={styles.kategoriRight}>
                    <Text style={[styles.kategoriNominal, { color: theme.text }]}>
                      {formatRupiah(k.total)}
                    </Text>
                    <Text style={[styles.kategoriPersen, { color: theme.subtext }]}>
                      {persen.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Bar chart: tren 6 bulan */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tren 6 Bulan</Text>
          {loading ? (
            <View style={[styles.skeleton, { backgroundColor: theme.skeleton }]} />
          ) : (
            <BarChart data={tren} theme={theme} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple bar chart without external library dependency
type BarChartProps = {
  data: TrenItem[];
  theme: typeof Colors['light'];
};

function BarChart({ data, theme }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.total_masuk, d.total_keluar)), 1);
  const CHART_HEIGHT = 120;
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <View>
      {/* Setiap kolom = batang + label dalam satu unit */}
      <View style={styles.barContainer}>
        {data.map((d, i) => {
          const hMasuk = (d.total_masuk / maxVal) * CHART_HEIGHT;
          const hKeluar = (d.total_keluar / maxVal) * CHART_HEIGHT;
          return (
            <View key={i} style={styles.barColumn}>
              {/* Zona batang — rata bawah */}
              <View style={[styles.barZone, { height: CHART_HEIGHT }]}>
                <View style={[styles.bar, { height: hMasuk || 2, backgroundColor: AppColors.income }]} />
                <View style={[styles.bar, { height: hKeluar || 2, backgroundColor: AppColors.expense }]} />
              </View>
              {/* Label tepat di bawah kolom ini */}
              <Text style={[styles.barLabel, { color: theme.subtext }]}>
                {BULAN[d.bulan - 1]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppColors.income }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>Pemasukan</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppColors.expense }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>Pengeluaran</Text>
        </View>
      </View>
    </View>
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
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1, borderRadius: 14, padding: 14,
  },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  skeleton: { height: 160, borderRadius: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14 },
  kategoriRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1,
  },
  kategoriLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rankNum: { fontSize: 12, width: 16, textAlign: 'center' },
  kategoriDot: { width: 8, height: 8, borderRadius: 4 },
  kategoriIconBox: { width: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  kategoriNama: { fontSize: 14, fontWeight: '500', flex: 1 },
  kategoriRight: { alignItems: 'flex-end', gap: 2 },
  kategoriNominal: { fontSize: 14, fontWeight: '600' },
  kategoriPersen: { fontSize: 11 },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barZone: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12 },
});
