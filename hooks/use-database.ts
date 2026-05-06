import { clearExpiredCache } from '@/db/ai-cache';
import { initDatabase } from '@/db/database';
import { getAllKategori } from '@/db/kategori';
import { getProfil } from '@/db/profil';
import { useAppStore } from '@/store/use-app-store';
import { useEffect, useState } from 'react';

export function useDatabase() {
  const [error, setError] = useState<string | null>(null);
  const { setDbReady, setProfil, setKategoriList, dbReady } = useAppStore();

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        await initDatabase();
        await clearExpiredCache();

        const [profil, kategori] = await Promise.all([getProfil(), getAllKategori()]);

        if (mounted) {
          setProfil(profil);
          setKategoriList(kategori);
          setDbReady(true);
        }
      } catch (e) {
        if (mounted) setError(String(e));
      }
    }

    setup();
    return () => { mounted = false; };
  }, [setDbReady, setProfil, setKategoriList]);

  return { dbReady, error };
}
