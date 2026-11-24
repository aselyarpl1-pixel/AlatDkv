// Mengimpor Link untuk navigasi antarhalaman Next.js
import Link from "next/link";

// Mengimpor koneksi Supabase khusus server
import { createAdminClient } from "@/lib/supabase/admin";

// Mengizinkan halaman menunggu data dinamis sebelum ditampilkan
export const instant = false;

// Membuat tipe data alat sesuai tabel Supabase
type Alat = {
  id: number;
  nama: string;
  kategori: string;
  stok: number;
  keterangan: string | null;
  aktif: boolean;
};

// Membuat tipe data peminjaman alat
type Peminjaman = {
  alat_id: number;
  jumlah: number;
};

// Membuat tipe data alat yang sudah dilengkapi stok tersedia
type AlatDenganStok = Alat & {
  stokDipinjam: number;
  stokTersedia: number;
};

// Mengubah kategori menjadi tulisan yang lebih rapi
function formatKategori(kategori: string) {
  return kategori
    .replaceAll("_", " ")
    .replace(/\b\w/g, (huruf) => huruf.toUpperCase());
}

// Halaman daftar alat laboratorium
export default async function DaftarAlat() {
  // Membuat koneksi ke database Supabase
  const supabase = createAdminClient();

  // Mengambil semua alat yang masih aktif dan mengurutkan berdasarkan ID
  const { data: alat, error: errorAlat } = await supabase
    .from("alat")
    .select("id, nama, kategori, stok, keterangan, aktif")
    .eq("aktif", true)
    .order("id", { ascending: true });

  // Memeriksa kesalahan saat mengambil data alat
  if (errorAlat) {
    console.error("Gagal mengambil data alat:", errorAlat.message);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-red-600">
            Data alat gagal dimuat
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Silakan coba kembali beberapa saat lagi.
          </p>
        </div>
      </main>
    );
  }

  // Mengubah hasil query menjadi array bertipe Alat
  const daftarAlat: Alat[] = (alat ?? []) as Alat[];

  // Mengambil data peminjaman yang sedang berlangsung
  const { data: peminjaman, error: errorPeminjaman } = await supabase
    .from("peminjaman_alat")
    .select("alat_id, jumlah")
    .eq("status", "dipinjam");

  // Memeriksa kesalahan saat mengambil data peminjaman
  if (errorPeminjaman) {
    console.error("Gagal mengambil data peminjaman:", errorPeminjaman.message);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-red-600">
            Stok alat gagal dimuat
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Silakan coba kembali beberapa saat lagi.
          </p>
        </div>
      </main>
    );
  }

  // Mengubah hasil query peminjaman menjadi array bertipe Peminjaman
  const daftarPeminjaman: Peminjaman[] = (peminjaman ?? []) as Peminjaman[];

  // Menghitung jumlah alat yang sedang dipinjam berdasarkan ID alat
  const totalDipinjam = new Map<number, number>();

  daftarPeminjaman.forEach((item) => {
    const jumlahSebelumnya = totalDipinjam.get(item.alat_id) ?? 0;

    totalDipinjam.set(item.alat_id, jumlahSebelumnya + item.jumlah);
  });

  // Menggabungkan data alat dengan perhitungan stok tersedia
  const daftarAlatDenganStok: AlatDenganStok[] = daftarAlat.map((item) => {
    // Mengambil jumlah alat yang sedang dipinjam
    const stokDipinjam = totalDipinjam.get(item.id) ?? 0;

    // Menghitung stok yang masih tersedia
    const stokTersedia = Math.max(0, item.stok - stokDipinjam);

    return {
      ...item,
      stokDipinjam,
      stokTersedia,
    };
  });

  // Menghitung jumlah jenis alat aktif
  const totalAlat = daftarAlatDenganStok.length;

  // Menghitung total stok awal seluruh alat aktif
  const totalStok = daftarAlatDenganStok.reduce(
    (total, item) => total + item.stok,
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Bagian navigasi website */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo dan nama aplikasi */}
          <div>
            <Link href="/" className="text-2xl font-bold text-blue-900">
              AlatDKV
            </Link>

            <p className="text-xs text-slate-500">
              Sistem Peminjaman Alat Laboratorium DKV
            </p>
          </div>

          {/* Menu navigasi menggunakan Link Next.js */}
          <div className="flex flex-wrap gap-6 text-sm font-medium">
            <Link href="/" className="transition hover:text-blue-700">
              Beranda
            </Link>

            <Link href="/alat" className="text-blue-700">
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

      {/* Bagian judul halaman */}
      <section className="bg-blue-900 px-6 py-14 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
            Katalog Laboratorium
          </p>

          <h2 className="mt-3 text-4xl font-bold">Daftar Alat DKV</h2>

          <p className="mt-4 max-w-2xl leading-relaxed text-blue-100">
            Temukan berbagai peralatan laboratorium DKV yang tersedia untuk
            mendukung kegiatan praktik dan pembelajaran.
          </p>
        </div>
      </section>

      {/* Bagian ringkasan alat */}
      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-10 sm:grid-cols-2">
        {/* Menampilkan jumlah jenis alat aktif */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Jumlah Jenis Alat</p>

          <h3 className="mt-2 text-3xl font-bold text-blue-900">{totalAlat}</h3>
        </div>

        {/* Menampilkan jumlah seluruh stok awal alat */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Stok Alat</p>

          <h3 className="mt-2 text-3xl font-bold text-blue-900">{totalStok}</h3>
        </div>
      </section>

      {/* Bagian katalog alat */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Katalog Peralatan
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Berikut daftar peralatan laboratorium yang dapat dipinjam.
          </p>
        </div>

        {/* Memeriksa apakah data alat tersedia */}
        {daftarAlatDenganStok.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-medium text-slate-600">
              Belum ada alat yang tersedia.
            </p>
          </div>
        ) : (
          /* Menampilkan data alat dalam bentuk kartu */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {daftarAlatDenganStok.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Ikon sesuai kategori alat */}
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

                <p className="mt-1 text-sm text-slate-500">
                  {formatKategori(item.kategori)}
                </p>

                {/* Menampilkan keterangan alat */}
                <p className="mt-4 min-h-10 text-sm leading-relaxed text-slate-600">
                  {item.keterangan || "Tidak ada keterangan."}
                </p>

                {/* Menampilkan jumlah stok tersedia */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-500">Stok tersedia</span>

                  <span className="font-bold text-blue-900">
                    {item.stokTersedia} unit
                  </span>
                </div>

                {/* Menampilkan jumlah alat yang sedang dipinjam */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Sedang dipinjam
                  </span>

                  <span className="text-sm font-semibold text-slate-700">
                    {item.stokDipinjam} unit
                  </span>
                </div>

                {/* Menampilkan status ketersediaan alat */}
                <div className="mt-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.stokTersedia > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.stokTersedia > 0 ? "Tersedia" : "Stok Habis"}
                  </span>
                </div>

                {/* Tombol menuju halaman detail alat */}
                <Link
                  href={`/alat/${item.id}`}
                  className="mt-6 block w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
                >
                  Lihat Detail
                </Link>
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
