import { getDatabase } from './database';

export type Anggaran = {
  id: number;
  kategori_id: number;
  batas_nominal: number;
  bulan: number;
  tahun: number;
  // joined
  kategori_nama?: string;
  kategori_ikon?: string;
  kategori_warna?: string;
  terpakai?: number;
};

export async function getAnggaranByBulan(bulan: number, tahun: number): Promise<Anggaran[]> {
  const db = await getDatabase();
  const bulanStr = String(bulan).padStart(2, '0');
  const prefix = `${tahun}-${bulanStr}`;

  return await db.getAllAsync<Anggaran>(
    `SELECT a.*, k.nama as kategori_nama, k.ikon as kategori_ikon, k.warna as kategori_warna,
            COALESCE(SUM(t.jumlah), 0) as terpakai
     FROM anggaran a
     LEFT JOIN kategori k ON a.kategori_id = k.id
     LEFT JOIN transaksi t ON t.kategori_id = a.kategori_id AND t.tanggal LIKE ? AND t.tipe = 'keluar'
     WHERE a.bulan = ? AND a.tahun = ?
     GROUP BY a.id`,
    [`${prefix}%`, bulan, tahun]
  );
}

export async function saveAnggaran(
  kategori_id: number,
  batas_nominal: number,
  bulan: number,
  tahun: number
): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM anggaran WHERE kategori_id = ? AND bulan = ? AND tahun = ?',
    [kategori_id, bulan, tahun]
  );

  if (existing) {
    await db.runAsync(
      'UPDATE anggaran SET batas_nominal = ? WHERE id = ?',
      [batas_nominal, existing.id]
    );
  } else {
    await db.runAsync(
      'INSERT INTO anggaran (kategori_id, batas_nominal, bulan, tahun) VALUES (?, ?, ?, ?)',
      [kategori_id, batas_nominal, bulan, tahun]
    );
  }
}

export async function deleteAnggaran(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM anggaran WHERE id = ?', [id]);
}

export async function deleteAllAnggaran(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM anggaran');
}
