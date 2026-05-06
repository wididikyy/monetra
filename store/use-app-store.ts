import { create } from 'zustand';
import { Profil } from '@/db/profil';
import { Transaksi, TransaksiSummary } from '@/db/transaksi';
import { Kategori } from '@/db/kategori';
import { Anggaran } from '@/db/anggaran';

type AppState = {
  // DB init state
  dbReady: boolean;
  setDbReady: (ready: boolean) => void;

  // Profil
  profil: Profil | null;
  setProfil: (profil: Profil | null) => void;

  // Kategori
  kategoriList: Kategori[];
  setKategoriList: (list: Kategori[]) => void;

  // Selected month/year for screens
  selectedBulan: number;
  selectedTahun: number;
  setSelectedBulan: (bulan: number, tahun: number) => void;

  // Dashboard summary cache
  summary: TransaksiSummary | null;
  setSummary: (s: TransaksiSummary | null) => void;

  // Recent transactions
  transaksiList: Transaksi[];
  setTransaksiList: (list: Transaksi[]) => void;

  // Anggaran
  anggaranList: Anggaran[];
  setAnggaranList: (list: Anggaran[]) => void;

  // Network
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Refresh trigger — increment to force re-fetch across screens
  refreshCounter: number;
  triggerRefresh: () => void;
};

export const useAppStore = create<AppState>((set) => {
  const now = new Date();
  return {
    dbReady: false,
    setDbReady: (ready) => set({ dbReady: ready }),

    profil: null,
    setProfil: (profil) => set({ profil }),

    kategoriList: [],
    setKategoriList: (list) => set({ kategoriList: list }),

    selectedBulan: now.getMonth() + 1,
    selectedTahun: now.getFullYear(),
    setSelectedBulan: (bulan, tahun) => set({ selectedBulan: bulan, selectedTahun: tahun }),

    summary: null,
    setSummary: (summary) => set({ summary }),

    transaksiList: [],
    setTransaksiList: (list) => set({ transaksiList: list }),

    anggaranList: [],
    setAnggaranList: (list) => set({ anggaranList: list }),

    isOnline: true,
    setIsOnline: (online) => set({ isOnline: online }),

    refreshCounter: 0,
    triggerRefresh: () => set((s) => ({ refreshCounter: s.refreshCounter + 1 })),
  };
});
