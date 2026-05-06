import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Theme } from '@/constants/theme';
import { KategoriSpend } from '@/db/transaksi';
import { formatRupiah } from '@/utils/format';

type Props = {
  data: KategoriSpend[];
};

const SIZE = 180;
const RADIUS = 70;
const STROKE = 28;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GrafikPengeluaran({ data }: Props) {
  const total = data.reduce((sum, k) => sum + k.total, 0);
  if (total === 0) return null;

  // Build segments
  let offset = 0;
  const segments = data.map((k) => {
    const persen = k.total / total;
    const dash = persen * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const seg = { ...k, dash, gap, offset, persen };
    offset += dash;
    return seg;
  });

  const top3 = data.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={SIZE} height={SIZE}>
          <G rotation="-90" origin={`${CENTER},${CENTER}`}>
            {segments.map((seg, i) => (
              <Circle
                key={i}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={seg.kategori_warna}
                strokeWidth={STROKE}
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={-seg.offset}
              />
            ))}
          </G>
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={[styles.centerTotal, { color: Theme.text }]}>{formatRupiah(total)}</Text>
          <Text style={[styles.centerSub, { color: Theme.subtext }]}>Total keluar</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {top3.map((k) => (
          <View key={k.kategori_id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: k.kategori_warna }]} />
            <View style={styles.legendInfo}>
              <Text style={[styles.legendNama, { color: Theme.text }]} numberOfLines={1}>
                {k.kategori_nama}
              </Text>
              <Text style={[styles.legendPersen, { color: Theme.subtext }]}>
                {((k.total / total) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  chartWrapper: { position: 'relative', width: SIZE, height: SIZE, justifyContent: 'center', alignItems: 'center' },
  centerLabel: { position: 'absolute', alignItems: 'center' },
  centerTotal: { fontSize: 15, fontWeight: '700' },
  centerSub: { fontSize: 11 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendInfo: { gap: 1 },
  legendNama: { fontSize: 13, fontWeight: '500' },
  legendPersen: { fontSize: 11 },
});
