import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

// Mengizinkan halaman mengambil data secara dinamis
export const instant = false;

// Tipe data alat
type Alat = {
  id: number;
  nama: string;
  kategori: string;
  stok: number;
  keterangan: string | null;
  aktif: boolean;
};

// Tipe data peminjaman
type Peminjaman = {
  jumlah: number;
};

// Mengubah kategori menjadi tulisan yang lebih rapi
function formatKategori(kategori: string) {
  return kategori
    .replaceAll("_", " ")
    .replace(/\b\w/g, (huruf) => huruf.toUpperCase());
}

// Halaman detail alat
export default async function DetailAlat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Mengambil ID alat dari URL
  const { id } = await params;

  // Memeriksa format ID
  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Mengambil data alat berdasarkan ID
  const { data: alatData, error: alatError } = await supabase
    .from("alat")
    .select("id, nama, kategori, stok, keterangan, aktif")
    .eq("id", Number(id))
    .maybeSingle();

  // Menampilkan halaman tidak ditemukan jika alat tidak ada
  if (alatError) {
    console.error("Gagal mengambil detail alat:", alatError.message);
    throw new Error("Gagal mengambil data alat.");
  }

  if (!alatData) {
    notFound();
  }

  const alat = alatData as Alat;

  // Alat yang tidak aktif tidak dapat diajukan
  if (!alat.aktif) {
    notFound();
  }

  // Mengambil peminjaman yang sedang berlangsung
  const { data: peminjamanData, error: peminjamanError } = await supabase
    .from("peminjaman_alat")
    .select("jumlah")
    .eq("alat_id", alat.id)
    .eq("status", "dipinjam");

  // Memeriksa kesalahan pengambilan data peminjaman
  if (peminjamanError) {
    console.error(
      "Gagal menghitung stok yang dipinjam:",
      peminjamanError.message,
    );

    throw new Error("Gagal menghitung stok alat.");
  }

  // Menghitung total unit yang sedang dipinjam
  const totalDipinjam = ((peminjamanData ?? []) as Peminjaman[]).reduce(
    (total, item) => total + item.jumlah,
    0,
  );

  // Menghitung jumlah stok yang tersedia
  const stokTersedia = Math.max(0, alat.stok - totalDipinjam);

  // Menentukan apakah alat bisa diajukan
  const bisaDiajukan = stokTersedia > 0;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navigasi halaman */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-blue-700">
            AlatDKV
          </Link>

          <div className="flex flex-wrap gap-5 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-700">
              Beranda
            </Link>

            <Link href="/alat" className="text-blue-700">
              Daftar Alat
            </Link>

            <Link href="/cek" className="hover:text-blue-700">
              Cek Peminjaman
            </Link>

            <Link href="/login" className="hover:text-blue-700">
              Login Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Konten detail alat */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        {/* Navigasi kembali */}
        <Link
          href="/alat"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          ← Kembali ke Daftar Alat
        </Link>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Informasi utama alat */}
          <div className="flex min-h-72 items-center justify-center rounded-3xl bg-linear-to-br from-blue-100 to-slate-200 p-10">
            <div className="text-center">
              <div className="text-7xl">📷</div>

              <p className="mt-5 text-sm font-medium uppercase tracking-widest text-blue-700">
                Laboratorium DKV
              </p>
            </div>
          </div>

          {/* Informasi detail alat */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-700">
              {formatKategori(alat.kategori)}
            </span>

            <h1 className="mt-6 text-3xl font-bold text-slate-800">
              {alat.nama}
            </h1>

            <p className="mt-4 leading-relaxed text-slate-500">
              {alat.keterangan || "Belum ada keterangan untuk alat ini."}
            </p>

            {/* Informasi stok */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Stok Awal</p>

                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {alat.stok}
                </p>

                <p className="mt-1 text-xs text-slate-400">Unit</p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-sm text-blue-600">Stok Tersedia</p>

                <p className="mt-2 text-2xl font-bold text-blue-700">
                  {stokTersedia}
                </p>

                <p className="mt-1 text-xs text-blue-500">Unit</p>
              </div>

              <div className="col-span-2 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Sedang Dipinjam</p>

                  <p className="font-bold text-slate-800">
                    {totalDipinjam} unit
                  </p>
                </div>
              </div>
            </div>

            {/* Status ketersediaan alat */}
            <div className="mt-6">
              {bisaDiajukan ? (
                <p className="text-sm font-medium text-green-700">
                  ✓ Alat tersedia dan dapat diajukan.
                </p>
              ) : (
                <p className="text-sm font-medium text-red-600">
                  Stok alat sedang habis dan belum dapat diajukan.
                </p>
              )}
            </div>

            {/* Tombol menuju formulir pengajuan */}
            {bisaDiajukan ? (
              <Link
                href={`/ajukan?alat_id=${alat.id}`}
                className="mt-6 block w-full rounded-xl bg-blue-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                Ajukan Peminjaman
              </Link>
            ) : (
              <button
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-300 px-5 py-4 font-semibold text-slate-500"
              >
                Stok Tidak Tersedia
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer halaman */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © 2026 AlatDKV. Sistem Informasi Peminjaman Alat Laboratorium DKV.
      </footer>
    </main>
  );
}
