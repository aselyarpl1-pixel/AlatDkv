// Mengimpor Link untuk navigasi antarhalaman Next.js
import Link from "next/link";

// Mengimpor koneksi Supabase khusus server untuk mengambil data
import { createAdminClient } from "@/lib/supabase/admin";

// Halaman mengambil data dinamis dari database, tidak bisa di-prerender statis
export const instant = false;

// Membuat tipe data Alat sesuai struktur tabel di Supabase
type Alat = {
  id: number;
  nama: string;
  kategori: string;
  stok: number;
  keterangan: string | null;
  aktif: boolean;
};

// Menyimpan daftar kategori alat yang tersedia
const kategoriAlat = [
  { nama: "Kamera", nilai: "kamera", ikon: "📷" },
  { nama: "Pencahayaan", nilai: "pencahayaan", ikon: "💡" },
  { nama: "Audio", nilai: "audio", ikon: "🎙️" },
  { nama: "Tablet", nilai: "tablet", ikon: "💻" },
  { nama: "Aksesori", nilai: "aksesori", ikon: "🛠️" },
];

// Halaman utama aplikasi AlatDKV
export default async function Home() {
  // Membuat koneksi ke database Supabase (pakai admin client agar konsisten)
  const supabase = createAdminClient();

  // Mengambil data alat yang masih aktif dari tabel alat
  const { data: alat, error } = await supabase
    .from("alat")
    .select("id, nama, kategori, stok, keterangan, aktif")
    .eq("aktif", true)
    .order("nama", { ascending: true });

  // Memeriksa apakah terjadi kesalahan saat mengambil data
  if (error) {
    console.error("Gagal mengambil data alat:", error.message);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-xl font-bold text-red-600">Data gagal dimuat</h1>
          <p className="mt-2 text-sm text-slate-600">
            Silakan coba kembali beberapa saat lagi.
          </p>
        </div>
      </main>
    );
  }

  // Mengubah hasil query menjadi tipe data Alat
  const daftarAlat: Alat[] = (alat ?? []) as Alat[];

  // Menghitung jumlah seluruh jenis alat yang aktif
  const totalAlat = daftarAlat.length;

  // Menghitung total stok dari semua alat yang aktif
  const totalStok = daftarAlat.reduce((total, item) => total + item.stok, 0);

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-800">
      {/* Bagian navigasi website */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-6 md:py-5">
          {/* Logo dan nama aplikasi */}
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-blue-900">AlatDKV</h1>
            <p className="text-xs text-slate-500">
              Sistem Peminjaman Alat Laboratorium DKV
            </p>
          </div>

          {/* Menu navigasi yang dapat menyesuaikan lebar layar */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm font-medium sm:gap-x-6 md:justify-end">
            <Link
              href="/"
              className="text-blue-700 transition hover:text-blue-900"
            >
              Beranda
            </Link>

            <Link href="/alat" className="transition hover:text-blue-700">
              Daftar Alat
            </Link>

            <Link href="/ajukan" className="transition hover:text-blue-700">
              Ajukan Peminjaman
            </Link>

            <Link href="/cek" className="transition hover:text-blue-700">
              Cek Status
            </Link>

            <Link href="/login" className="transition hover:text-blue-700">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Bagian utama atau hero section */}
      <section className="bg-blue-900 px-4 py-14 text-white sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-200 sm:text-sm">
            Laboratorium Desain Komunikasi Visual
          </p>

          <h2 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Peminjaman Alat Laboratorium DKV Lebih Mudah
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
            Temukan dan pinjam berbagai peralatan laboratorium untuk mendukung
            kegiatan praktik dan kreativitasmu.
          </p>

          {/* Tombol menuju halaman daftar alat dan pengajuan */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/alat"
              className="w-full rounded-lg bg-white px-6 py-3 text-center text-sm font-semibold text-blue-900 transition hover:bg-blue-100 sm:w-auto sm:text-base"
            >
              Lihat Daftar Alat
            </Link>

            <Link
              href="/ajukan"
              className="w-full rounded-lg border border-white px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-800 sm:w-auto sm:text-base"
            >
              Ajukan Peminjaman
            </Link>
          </div>
        </div>
      </section>

      {/* Bagian ringkasan jumlah alat */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-8 sm:grid-cols-2 sm:gap-5 sm:px-6 sm:py-10">
        {/* Menampilkan jumlah jenis alat aktif */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">Jenis Alat Aktif</p>
          <h3 className="mt-2 text-3xl font-bold text-blue-900">{totalAlat}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Jenis peralatan tersedia
          </p>
        </div>

        {/* Menampilkan jumlah keseluruhan stok alat */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">Total Stok Alat</p>
          <h3 className="mt-2 text-3xl font-bold text-blue-900">{totalStok}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Unit dari seluruh alat aktif
          </p>
        </div>
      </section>

      {/* Bagian kategori alat */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 sm:text-sm">
            Kategori Peralatan
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
            Jelajahi Berdasarkan Kategori
          </h2>
        </div>

        {/* Menampilkan pilihan kategori dalam bentuk kartu ringkas */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {kategoriAlat.map((kategori) => {
            // Menghitung jumlah alat pada setiap kategori
            const jumlah = daftarAlat.filter(
              (item) => item.kategori === kategori.nilai,
            ).length;

            return (
              <Link
                key={kategori.nilai}
                href={`/alat?kategori=${kategori.nilai}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className="text-xl">{kategori.ikon}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {kategori.nama}
                </span>
                <span className="text-xs text-slate-500">({jumlah})</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bagian daftar alat yang diambil dari Supabase */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 sm:text-sm">
              Katalog Peralatan
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Alat Laboratorium
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Berikut peralatan yang dapat dipinjam.
            </p>
          </div>

          {/* Link untuk melihat seluruh daftar alat */}
          <Link
            href="/alat"
            className="w-fit text-sm font-semibold text-blue-700 transition hover:text-blue-900"
          >
            Lihat Semua Alat →
          </Link>
        </div>

        {/* Memeriksa apakah data alat tersedia */}
        {daftarAlat.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center sm:p-10">
            <p className="font-medium text-slate-600">
              Belum ada alat yang tersedia.
            </p>
          </div>
        ) : (
          /* Menampilkan setiap alat dalam bentuk kartu responsif */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {daftarAlat.map((item) => (
              <div
                key={item.id}
                className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6"
              >
                {/* Ikon berdasarkan kategori alat */}
                <div className="mb-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {item.kategori === "kamera"
                    ? "📷"
                    : item.kategori === "pencahayaan"
                      ? "💡"
                      : item.kategori === "audio"
                        ? "🎙️"
                        : item.kategori === "tablet"
                          ? "💻"
                          : "🛠️"}
                </div>

                {/* Menampilkan nama dan kategori alat */}
                <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {item.nama}
                </h3>

                <p className="mt-1 text-sm capitalize text-slate-500">
                  {item.kategori}
                </p>

                {/* Menampilkan keterangan alat dari database */}
                <p className="mt-4 min-h-10 flex-1 text-sm leading-relaxed text-slate-600">
                  {item.keterangan || "Tidak ada keterangan."}
                </p>

                {/* Menampilkan jumlah stok alat */}
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-500">Stok tersedia</span>

                  <span className="shrink-0 font-bold text-blue-900">
                    {item.stok} unit
                  </span>
                </div>

                {/* Menampilkan status ketersediaan alat */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.stok > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.stok > 0 ? "Tersedia" : "Stok Habis"}
                  </span>

                  {/* Link menuju halaman detail alat */}
                  <Link
                    href={`/alat/${item.id}`}
                    className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    Detail →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bagian footer website */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center sm:px-6">
        <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
          © 2026 AlatDKV. Sistem Peminjaman Alat Laboratorium DKV.
        </p>
      </footer>
    </main>
  );
}
