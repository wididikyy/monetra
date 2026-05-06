import * as SQLite from 'expo-sqlite';
import { KATEGORI_DEFAULT } from '@/constants/kategori-default';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('monetra.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`PRAGMA journal_mode = WAL;`);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS profil (
      id INTEGER PRIMARY KEY,
      nama TEXT NOT NULL DEFAULT 'Pengguna',
      mata_uang TEXT NOT NULL DEFAULT 'IDR',
      penghasilan_bulanan REAL DEFAULT 0,
      dibuat_pada TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kategori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      ikon TEXT NOT NULL,
      tipe TEXT NOT NULL CHECK(tipe IN ('masuk', 'keluar')),
      warna TEXT NOT NULL DEFAULT '#6B7280'
    );

    CREATE TABLE IF NOT EXISTS transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jumlah REAL NOT NULL,
      tipe TEXT NOT NULL CHECK(tipe IN ('masuk', 'keluar')),
      kategori_id INTEGER REFERENCES kategori(id),
      catatan TEXT,
      tanggal TEXT NOT NULL,
      dibuat_pada TEXT NOT NULL,
      sumber TEXT DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS anggaran (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kategori_id INTEGER REFERENCES kategori(id),
      batas_nominal REAL NOT NULL,
      bulan INTEGER NOT NULL,
      tahun INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pertanyaan_hash TEXT NOT NULL,
      respons TEXT NOT NULL,
      konteks_bulan TEXT NOT NULL,
      dibuat_pada TEXT NOT NULL,
      kadaluarsa_pada TEXT NOT NULL
    );
  `);

  await seedKategoriDefault(database);
}

async function seedKategoriDefault(database: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM kategori'
  );

  if (existing && existing.count > 0) return;

  for (const k of KATEGORI_DEFAULT) {
    await database.runAsync(
      'INSERT INTO kategori (nama, ikon, tipe, warna) VALUES (?, ?, ?, ?)',
      [k.nama, k.ikon, k.tipe, k.warna]
    );
  }
}
