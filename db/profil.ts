import { getDatabase } from './database';

export type Profil = {
  id: number;
  nama: string;
  mata_uang: string;
  penghasilan_bulanan: number;
  dibuat_pada: string;
};

export async function getProfil(): Promise<Profil | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<Profil>('SELECT * FROM profil LIMIT 1');
}

export async function saveProfil(
  nama: string,
  mata_uang: string,
  penghasilan_bulanan: number
): Promise<void> {
  const db = await getDatabase();
  const existing = await getProfil();
  const now = new Date().toISOString();

  if (existing) {
    await db.runAsync(
      'UPDATE profil SET nama = ?, mata_uang = ?, penghasilan_bulanan = ? WHERE id = ?',
      [nama, mata_uang, penghasilan_bulanan, existing.id]
    );
  } else {
    await db.runAsync(
      'INSERT INTO profil (id, nama, mata_uang, penghasilan_bulanan, dibuat_pada) VALUES (1, ?, ?, ?, ?)',
      [nama, mata_uang, penghasilan_bulanan, now]
    );
  }
}

export async function updateProfil(
  fields: Partial<Omit<Profil, 'id' | 'dibuat_pada'>>
): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return;

  const setClauses = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);

  await db.runAsync(`UPDATE profil SET ${setClauses} WHERE id = 1`, values as (string | number | null)[]);
}
