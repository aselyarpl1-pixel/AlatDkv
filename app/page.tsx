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

// Menentukan ikon berdasarkan kategori alat
function ikonKategori(kategori: string) {
  switch (kategori) {
    case "kamera":
      return "📷";
    case "pencahayaan":
      return "💡";
    case "audio":
      return "🎙️";
    case "tablet":
      return "💻";
    default:
      return "🛠️";
  }
}

// Langkah-langkah peminjaman yang ditampilkan di beranda
const langkahPeminjaman = [
  {
    nomor: "1",
    judul: "Pilih Alat",
    isi: "Telusuri katalog dan pilih peralatan yang ingin dipinjam.",
  },
  {
    nomor: "2",
    judul: "Ajukan Peminjaman",
    isi: "Isi formulir pengajuan beserta jumlah dan jadwal pemakaian.",
  },
  {
    nomor: "3",
    judul: "Cek Status",
    isi: "Pantau status pengajuan menggunakan nama dan nomor peminjaman.",
  },
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

      {/* Bagian hero untuk memperkenalkan aplikasi */}
      <section className="bg-linear-to-br from-blue-950 via-blue-900 to-blue-800 px-4 py-14 text-white sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="inline-block rounded-full bg-blue-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-100 ring-1 ring-inset ring-blue-400/30">
            Laboratorium Desain Komunikasi Visual
          </span>

          <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
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
              className="w-full rounded-lg border border-white/70 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-800 sm:w-auto sm:text-base"
            >
              Ajukan Peminjaman
            </Link>
          </div>

          {/* Ringkasan jumlah alat ditampilkan langsung di dalam hero */}
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-6 border-t border-blue-400/25 pt-8">
            <div>
              <p className="text-3xl font-bold sm:text-4xl">{totalAlat}</p>
              <p className="mt-1 text-sm text-blue-200">Jenis alat aktif</p>
            </div>

            <div>
              <p className="text-3xl font-bold sm:text-4xl">{totalStok}</p>
              <p className="mt-1 text-sm text-blue-200">Total unit tersedia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian kategori alat dalam bentuk kartu besar */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 sm:text-sm">
            Kategori Peralatan
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
            Jelajahi Berdasarkan Kategori
          </h2>
        </div>

        {/* Menampilkan pilihan kategori dalam bentuk kartu */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kategoriAlat.map((kategori) => {
            // Menghitung jumlah alat pada setiap kategori
            const jumlah = daftarAlat.filter(
              (item) => item.kategori === kategori.nilai,
            ).length;

            return (
              <Link
                key={kategori.nilai}
                href={`/alat?kategori=${kategori.nilai}`}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {kategori.ikon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900 group-hover:text-blue-800">
                    {kategori.nama}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {jumlah} jenis alat
                  </span>
                </span>

                <span className="text-blue-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bagian langkah-langkah peminjaman */}
      <section className="border-y border-slate-200 bg-white px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 sm:text-sm">
              Alur Peminjaman
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
              Cara Meminjam Alat
            </h2>
          </div>

          {/* Menampilkan tiga langkah peminjaman */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {langkahPeminjaman.map((langkah) => (
              <div
                key={langkah.nomor}
                className="rounded-xl border border-slate-200 bg-slate-50 p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                  {langkah.nomor}
                </span>

                <h3 className="mt-4 font-bold text-slate-900">
                  {langkah.judul}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {langkah.isi}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bagian sorotan alat unggulan (hanya beberapa alat) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 sm:text-sm">
              Katalog Peralatan
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
              Alat Pilihan
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Beberapa peralatan yang dapat dipinjam.
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
          /* Menampilkan 3 alat pertama dalam bentuk kartu ringkas */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {daftarAlat.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/alat/${item.id}`}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {ikonKategori(item.kategori)}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900 group-hover:text-blue-800">
                    {item.nama}
                  </span>

                  <span className="mt-0.5 block text-xs capitalize text-slate-500">
                    {item.kategori} · {item.stok} unit
                  </span>

                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.stok > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.stok > 0 ? "Tersedia" : "Stok Habis"}
                  </span>
                </span>
              </Link>
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
