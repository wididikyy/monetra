import { getSummaryByBulan, getTopKategoriByBulan, getTrenBulanan } from '@/db/transaksi';
import { getProfil } from '@/db/profil';
import { getAnggaranByBulan } from '@/db/anggaran';
import { formatRupiah } from '@/utils/format';

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export async function buildFinancialContext(): Promise<string> {
  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  const [profil, summary, topKategori, tren, anggaran] = await Promise.all([
    getProfil(),
    getSummaryByBulan(bulan, tahun),
    getTopKategoriByBulan(bulan, tahun, 5),
    getTrenBulanan(3),
    getAnggaranByBulan(bulan, tahun),
  ]);

  const nama = profil?.nama ?? 'Pengguna';
  const penghasilan = profil?.penghasilan_bulanan ?? 0;
  const saldo = summary.total_masuk - summary.total_keluar;

  const daftarKategori = topKategori.length > 0
    ? topKategori
        .map((k, i) => `  ${i + 1}. ${k.kategori_nama}: ${formatRupiah(k.total)}`)
        .join('\n')
    : '  (belum ada pengeluaran bulan ini)';

  const trenBulanan = tren
    .map((t) => `  ${NAMA_BULAN[t.bulan - 1]} ${t.tahun}: masuk ${formatRupiah(t.total_masuk)}, keluar ${formatRupiah(t.total_keluar)}`)
    .join('\n');

  const sisaAnggaran = anggaran.length > 0
    ? anggaran
        .map((a) => {
          const sisa = a.batas_nominal - (a.terpakai ?? 0);
          return `  ${a.kategori_nama}: sisa ${formatRupiah(sisa)} dari ${formatRupiah(a.batas_nominal)}`;
        })
        .join('\n')
    : '  (tidak ada anggaran yang diset)';

  return `Kamu adalah asisten keuangan personal bernama Monetra. Berikan jawaban dalam bahasa Indonesia yang ramah, singkat, dan actionable.

Data keuangan pengguna:
Nama: ${nama}
Penghasilan bulanan: ${formatRupiah(penghasilan)}

Bulan ini (${NAMA_BULAN[bulan - 1]} ${tahun}):
- Total pemasukan: ${formatRupiah(summary.total_masuk)}
- Total pengeluaran: ${formatRupiah(summary.total_keluar)}
- Saldo bersih: ${formatRupiah(saldo)}

Top pengeluaran per kategori bulan ini:
${daftarKategori}

Sisa anggaran:
${sisaAnggaran}

Tren 3 bulan terakhir:
${trenBulanan}

Berikan jawaban yang personal, singkat (maks 3-4 kalimat), dan berikan saran konkret jika relevan.`;
}
