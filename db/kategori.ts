import { getDatabase } from './database';

export type Kategori = {
  id: number;
  nama: string;
  ikon: string;
  tipe: 'masuk' | 'keluar';
  warna: string;
};

export async function getAllKategori(): Promise<Kategori[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Kategori>('SELECT * FROM kategori ORDER BY tipe, nama');
}

export async function getKategoriByTipe(tipe: 'masuk' | 'keluar'): Promise<Kategori[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Kategori>(
    'SELECT * FROM kategori WHERE tipe = ? ORDER BY nama',
    [tipe]
  );
}

export async function getKategoriById(id: number): Promise<Kategori | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<Kategori>('SELECT * FROM kategori WHERE id = ?', [id]);
}

export async function addKategori(
  nama: string,
  ikon: string,
  tipe: 'masuk' | 'keluar',
  warna: string
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO kategori (nama, ikon, tipe, warna) VALUES (?, ?, ?, ?)',
    [nama, ikon, tipe, warna]
  );
  return result.lastInsertRowId;
}

export async function deleteKategori(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM kategori WHERE id = ?', [id]);
}
