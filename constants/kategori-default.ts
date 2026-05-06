export type KategoriDefault = {
  nama: string;
  ikon: string;
  tipe: 'masuk' | 'keluar';
  warna: string;
};

export const KATEGORI_DEFAULT: KategoriDefault[] = [
  { nama: 'Makan & Minum', ikon: 'fork.knife',       tipe: 'keluar', warna: '#F59E0B' },
  { nama: 'Transportasi',  ikon: 'car.fill',          tipe: 'keluar', warna: '#3B82F6' },
  { nama: 'Belanja',       ikon: 'bag.fill',          tipe: 'keluar', warna: '#EC4899' },
  { nama: 'Tagihan',       ikon: 'house.fill',        tipe: 'keluar', warna: '#6366F1' },
  { nama: 'Kesehatan',     ikon: 'cross.fill',        tipe: 'keluar', warna: '#EF4444' },
  { nama: 'Hiburan',       ikon: 'gamecontroller.fill', tipe: 'keluar', warna: '#8B5CF6' },
  { nama: 'Gaji',          ikon: 'banknote.fill',     tipe: 'masuk',  warna: '#10B981' },
  { nama: 'Freelance',     ikon: 'laptopcomputer',    tipe: 'masuk',  warna: '#14B8A6' },
  { nama: 'Lainnya',       ikon: 'square.grid.2x2.fill', tipe: 'keluar', warna: '#6B7280' },
  { nama: 'Lainnya',       ikon: 'square.grid.2x2.fill', tipe: 'masuk', warna: '#6B7280' },
];
