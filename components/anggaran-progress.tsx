import { View, Text, StyleSheet } from 'react-native';

import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { Theme, AppColors } from '@/constants/theme';
import { Anggaran } from '@/db/anggaran';
import { formatRupiah } from '@/utils/format';

type Props = {
  anggaran: Anggaran;
};

export function AnggaranProgress({ anggaran }: Props) {
  const terpakai = anggaran.terpakai ?? 0;
  const persen = anggaran.batas_nominal > 0
    ? Math.min(terpakai / anggaran.batas_nominal, 1)
    : 0;
  const sisa = anggaran.batas_nominal - terpakai;
  const isOverBudget = terpakai > anggaran.batas_nominal;

  const barColor = isOverBudget
    ? AppColors.expense
    : persen > 0.8
    ? AppColors.warning
    : anggaran.kategori_warna ?? AppColors.primary;

  return (
    <View style={[styles.container, { borderColor: Theme.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${barColor}20` }]}>
            <IconSymbol
              name={(anggaran.kategori_ikon ?? 'circle.fill') as IconSymbolName}
              size={16}
              color={barColor}
            />
          </View>
          <Text style={[styles.nama, { color: Theme.text }]}>{anggaran.kategori_nama}</Text>
        </View>
        <Text style={[styles.sisa, { color: isOverBudget ? AppColors.expense : Theme.subtext }]}>
          {isOverBudget ? `Lebih ${formatRupiah(Math.abs(sisa))}` : `Sisa ${formatRupiah(sisa)}`}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.track, { backgroundColor: Theme.skeleton }]}>
        <View style={[styles.fill, { width: `${persen * 100}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Theme.subtext }]}>
          {formatRupiah(terpakai)} dari {formatRupiah(anggaran.batas_nominal)}
        </Text>
        <Text style={[styles.footerText, { color: barColor }]}>
          {Math.round(persen * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 10, borderBottomWidth: 1, gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  nama: { fontSize: 14, fontWeight: '600' },
  sisa: { fontSize: 12, fontWeight: '500' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 11 },
});
