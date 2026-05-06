import { getDatabase } from './database';

export type Transaksi = {
  id: number;
  jumlah: number;
  tipe: 'masuk' | 'keluar';
  kategori_id: number | null;
  catatan: string | null;
  tanggal: string;
  dibuat_pada: string;
  sumber: string;
  // joined fields
  kategori_nama?: string;
  kategori_ikon?: string;
  kategori_warna?: string;
};

export type TransaksiSummary = {
  total_masuk: number;
  total_keluar: number;
};

export type KategoriSpend = {
  kategori_id: number;
  kategori_nama: string;
  kategori_ikon: string;
  kategori_warna: string;
  total: number;
};

export async function addTransaksi(
  jumlah: number,
  tipe: 'masuk' | 'keluar',
  kategori_id: number,
  catatan: string | null,
  tanggal: string
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO transaksi (jumlah, tipe, kategori_id, catatan, tanggal, dibuat_pada, sumber)
     VALUES (?, ?, ?, ?, ?, ?, 'manual')`,
    [jumlah, tipe, kategori_id, catatan, tanggal, now]
  );
  return result.lastInsertRowId;
}

export async function deleteTransaksi(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transaksi WHERE id = ?', [id]);
}

export async function getTransaksiByBulan(
  bulan: number,
  tahun: number
): Promise<Transaksi[]> {
  const db = await getDatabase();
  const bulanStr = String(bulan).padStart(2, '0');
  const prefix = `${tahun}-${bulanStr}`;

  return await db.getAllAsync<Transaksi>(
    `SELECT t.*, k.nama as kategori_nama, k.ikon as kategori_ikon, k.warna as kategori_warna
     FROM transaksi t
     LEFT JOIN kategori k ON t.kategori_id = k.id
     WHERE t.tanggal LIKE ?
     ORDER BY t.tanggal DESC, t.dibuat_pada DESC`,
    [`${prefix}%`]
  );
}

export async function getSummaryByBulan(
  bulan: number,
  tahun: number
): Promise<TransaksiSummary> {
  const db = await getDatabase();
  const bulanStr = String(bulan).padStart(2, '0');
  const prefix = `${tahun}-${bulanStr}`;

  const result = await db.getFirstAsync<{ total_masuk: number; total_keluar: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE 0 END), 0) as total_masuk,
       COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN jumlah ELSE 0 END), 0) as total_keluar
     FROM transaksi
     WHERE tanggal LIKE ?`,
    [`${prefix}%`]
  );

  return result ?? { total_masuk: 0, total_keluar: 0 };
}

export async function getTopKategoriByBulan(
  bulan: number,
  tahun: number,
  limit = 5
): Promise<KategoriSpend[]> {
  const db = await getDatabase();
  const bulanStr = String(bulan).padStart(2, '0');
  const prefix = `${tahun}-${bulanStr}`;

  return await db.getAllAsync<KategoriSpend>(
    `SELECT t.kategori_id, k.nama as kategori_nama, k.ikon as kategori_ikon,
            k.warna as kategori_warna, SUM(t.jumlah) as total
     FROM transaksi t
     LEFT JOIN kategori k ON t.kategori_id = k.id
     WHERE t.tipe = 'keluar' AND t.tanggal LIKE ?
     GROUP BY t.kategori_id
     ORDER BY total DESC
     LIMIT ?`,
    [`${prefix}%`, limit]
  );
}

export async function getTrenBulanan(bulanCount = 6): Promise<
  { bulan: number; tahun: number; total_masuk: number; total_keluar: number }[]
> {
  const db = await getDatabase();
  const results: { bulan: number; tahun: number; total_masuk: number; total_keluar: number }[] = [];

  const now = new Date();
  for (let i = bulanCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const bulan = d.getMonth() + 1;
    const tahun = d.getFullYear();
    const prefix = `${tahun}-${String(bulan).padStart(2, '0')}`;

    const row = await db.getFirstAsync<{ total_masuk: number; total_keluar: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE 0 END), 0) as total_masuk,
         COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN jumlah ELSE 0 END), 0) as total_keluar
       FROM transaksi WHERE tanggal LIKE ?`,
      [`${prefix}%`]
    );
    results.push({ bulan, tahun, total_masuk: row?.total_masuk ?? 0, total_keluar: row?.total_keluar ?? 0 });
  }
  return results;
}

export async function deleteAllTransaksi(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transaksi');
}
