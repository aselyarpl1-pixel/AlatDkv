// Mengimpor Link untuk navigasi antarhalaman Next.js
import Link from "next/link";

// Mengimpor fungsi koneksi Supabase dari sisi server
import { createClient } from "@/lib/supabase/server";

// Mengizinkan halaman menunggu data dinamis sebelum ditampilkan
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

// Halaman utama aplikasi AlatDKV
export default async function Home() {
  // Membuat koneksi ke database Supabase
  const supabase = await createClient();

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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
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
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Bagian navigasi website */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo dan nama aplikasi */}
          <div>
            <h1 className="text-2xl font-bold text-blue-900">AlatDKV</h1>

            <p className="text-xs text-slate-500">
              Sistem Peminjaman Alat Laboratorium DKV
            </p>
          </div>

          {/* Menu navigasi menggunakan Link Next.js */}
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/" className="text-blue-700">
              Beranda
            </Link>

            <Link href="/alat" className="transition hover:text-blue-700">
              Daftar Alat
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
      <section className="bg-blue-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-200">
            Laboratorium Desain Komunikasi Visual
          </p>

          <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Peminjaman Alat Laboratorium DKV Lebih Mudah
          </h2>

          <p className="mt-5 max-w-2xl leading-relaxed text-blue-100">
            Temukan dan pinjam berbagai peralatan laboratorium untuk mendukung
            kegiatan praktik dan kreativitasmu.
          </p>

          {/* Tombol menuju halaman daftar alat */}
          <Link
            href="/alat"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-900 transition hover:bg-blue-100"
          >
            Lihat Daftar Alat
          </Link>
        </div>
      </section>

      {/* Bagian ringkasan jumlah alat */}
      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-10 md:grid-cols-2">
        {/* Menampilkan jumlah jenis alat aktif */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Jenis Alat Aktif</p>

          <h3 className="mt-2 text-3xl font-bold text-blue-900">{totalAlat}</h3>

          <p className="mt-1 text-sm text-slate-500">
            Jenis peralatan tersedia
          </p>
        </div>

        {/* Menampilkan jumlah keseluruhan stok alat */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Stok Alat</p>

          <h3 className="mt-2 text-3xl font-bold text-blue-900">{totalStok}</h3>

          <p className="mt-1 text-sm text-slate-500">
            Unit dari seluruh alat aktif
          </p>
        </div>
      </section>

      {/* Bagian daftar alat yang diambil dari Supabase */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Katalog Peralatan
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Alat Laboratorium
          </h2>

          <p className="mt-2 text-slate-500">
            Berikut peralatan yang dapat dipinjam.
          </p>
        </div>

        {/* Memeriksa apakah data alat tersedia */}
        {daftarAlat.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-medium text-slate-600">
              Belum ada alat yang tersedia.
            </p>
          </div>
        ) : (
          /* Menampilkan setiap alat dalam bentuk kartu */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {daftarAlat.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Ikon berdasarkan kategori alat */}
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {item.kategori === "kamera"
                    ? "📷"
                    : item.kategori === "pencahayaan"
                      ? "💡"
                      : item.kategori === "audio"
                        ? "🎙️"
                        : item.kategori === "tablet"
                          ? "📱"
                          : "🎒"}
                </div>

                {/* Menampilkan nama dan kategori alat */}
                <h3 className="text-xl font-bold text-slate-900">
                  {item.nama}
                </h3>

                <p className="mt-1 text-sm capitalize text-slate-500">
                  {item.kategori}
                </p>

                {/* Menampilkan keterangan alat dari database */}
                <p className="mt-4 min-h-10 text-sm leading-relaxed text-slate-600">
                  {item.keterangan || "Tidak ada keterangan."}
                </p>

                {/* Menampilkan jumlah stok alat */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-500">Stok tersedia</span>

                  <span className="font-bold text-blue-900">
                    {item.stok} unit
                  </span>
                </div>

                {/* Menampilkan status ketersediaan alat */}
                <div className="mt-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.stok > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.stok > 0 ? "Tersedia" : "Stok Habis"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bagian footer website */}
      <footer className="border-t border-slate-200 bg-white px-6 py-6 text-center">
        <p className="text-sm text-slate-500">
          © 2026 AlatDKV. Sistem Peminjaman Alat Laboratorium DKV.
        </p>
      </footer>
    </main>
  );
}
