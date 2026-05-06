import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { AppColors, Theme } from '@/constants/theme';
import { Transaksi, deleteTransaksi } from '@/db/transaksi';
import { useAppStore } from '@/store/use-app-store';
import { formatRupiah, formatTanggalPendek } from '@/utils/format';

type Props = {
  transaksi: Transaksi;
  onDelete?: () => void;
};

export function TransaksiCard({ transaksi, onDelete }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);

  const isMasuk = transaksi.tipe === 'masuk';

  function handleDelete() {
    Alert.alert(
      'Hapus Transaksi',
      `Yakin hapus transaksi ${formatRupiah(transaksi.jumlah)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            await deleteTransaksi(transaksi.id);
            triggerRefresh();
            onDelete?.();
          },
        },
      ]
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: Theme.card, borderColor: Theme.border }]}
      onLongPress={handleDelete}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${transaksi.kategori_warna ?? '#6B7280'}20` }]}>
        <IconSymbol
          name={(transaksi.kategori_ikon ?? 'circle.fill') as IconSymbolName}
          size={20}
          color={transaksi.kategori_warna ?? '#6B7280'}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.kategori, { color: Theme.text }]} numberOfLines={1}>
          {transaksi.kategori_nama ?? 'Lainnya'}
        </Text>
        {transaksi.catatan ? (
          <Text style={[styles.catatan, { color: Theme.subtext }]} numberOfLines={1}>
            {transaksi.catatan}
          </Text>
        ) : (
          <Text style={[styles.catatan, { color: Theme.subtext }]}>
            {formatTanggalPendek(transaksi.tanggal)}
          </Text>
        )}
      </View>

      {/* Amount */}
      <Text style={[styles.amount, { color: isMasuk ? AppColors.income : AppColors.expense }]}>
        {isMasuk ? '+' : '-'}{formatRupiah(transaksi.jumlah)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1, gap: 2 },
  kategori: { fontSize: 14, fontWeight: '600' },
  catatan: { fontSize: 12 },
  amount: { fontSize: 15, fontWeight: '700' },
});
