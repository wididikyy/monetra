import { getDatabase } from './database';

export type AiCache = {
  id: number;
  pertanyaan_hash: string;
  respons: string;
  konteks_bulan: string;
  dibuat_pada: string;
  kadaluarsa_pada: string;
};

// Simple hash: djb2 algorithm (no native crypto needed)
export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function buildCacheKey(pertanyaan: string, bulan: number, tahun: number): string {
  return hashString(`${pertanyaan}__${bulan}__${tahun}`);
}

export async function getCache(hash: string): Promise<AiCache | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  return await db.getFirstAsync<AiCache>(
    'SELECT * FROM ai_cache WHERE pertanyaan_hash = ? AND kadaluarsa_pada > ?',
    [hash, now]
  );
}

export async function saveCache(
  hash: string,
  respons: string,
  konteksBulan: string
): Promise<void> {
  const db = await getDatabase();
  const now = new Date();
  const expire = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

  await db.runAsync(
    `INSERT OR REPLACE INTO ai_cache (pertanyaan_hash, respons, konteks_bulan, dibuat_pada, kadaluarsa_pada)
     VALUES (?, ?, ?, ?, ?)`,
    [hash, respons, konteksBulan, now.toISOString(), expire.toISOString()]
  );
}

export async function clearExpiredCache(): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('DELETE FROM ai_cache WHERE kadaluarsa_pada <= ?', [now]);
}

export async function clearAllCache(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM ai_cache');
}
