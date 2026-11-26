// Mengimpor Link untuk navigasi antarhalaman Next.js
import Link from "next/link";

// Mengimpor notFound untuk menampilkan halaman 404
import { notFound } from "next/navigation";

// Mengimpor koneksi Supabase khusus server
import { createAdminClient } from "@/lib/supabase/admin";

// Halaman mengambil data dinamis dari database, tidak bisa di-prerender statis
export const instant = false;

// Membuat tipe data alat
type Alat = {
  id: number;
  nama: string;
  kategori: string;
  stok: number;
  keterangan: string | null;
  aktif: boolean;
};

// Membuat tipe data peminjaman
type Peminjaman = {
  jumlah: number;
};

// Tipe data riwayat peminjaman alat
type RiwayatPeminjaman = {
  id: number;
  peminjam: string;
  kelas: string;
  jumlah: number;
  tgl_pinjam: string;
  tgl_kembali: string;
  status: string;
  tgl_dikembalikan: string | null;
  kondisi_kembali: string | null;
};

// Mengubah kategori menjadi tulisan yang lebih rapi
function formatKategori(kategori: string) {
  return kategori
    .replaceAll("_", " ")
    .replace(/\b\w/g, (huruf) => huruf.toUpperCase());
}

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
    case "aksesori":
      return "🛠️";
    default:
      return "📦";
  }
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

  // Memeriksa kesalahan pengambilan data alat
  if (alatError) {
    console.error("Gagal mengambil detail alat:", alatError.message);
    throw new Error("Gagal mengambil data alat.");
  }

  // Menampilkan halaman tidak ditemukan jika alat tidak ada
  if (!alatData) {
    notFound();
  }

  // Mengubah data menjadi tipe Alat
  const alat = alatData as Alat;

  // Alat yang tidak aktif tidak dapat diajukan
  if (!alat.aktif) {
    notFound();
  }

  // Mengambil peminjaman aktif dan riwayat secara paralel untuk mempercepat
  const [hasilPeminjaman, hasilRiwayat] = await Promise.all([
    supabase
      .from("peminjaman_alat")
      .select("jumlah")
      .eq("alat_id", alat.id)
      .eq("status", "dipinjam"),
    supabase
      .from("peminjaman_alat")
      .select(
        "id, peminjam, kelas, jumlah, tgl_pinjam, tgl_kembali, status, tgl_dikembalikan, kondisi_kembali",
      )
      .eq("alat_id", alat.id)
      .order("id", { ascending: false }),
  ]);

  const { data: peminjamanData, error: peminjamanError } = hasilPeminjaman;
  const { data: riwayatData, error: riwayatError } = hasilRiwayat;

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

  if (riwayatError) {
    console.error(
      "Gagal mengambil riwayat peminjaman alat:",
      riwayatError.message,
    );
  }

  const riwayatPeminjaman = ((riwayatData ?? []) as RiwayatPeminjaman[]).map(
    (item) => ({
      ...item,
      // Menandai status "terlambat" jika masih dipinjam dan lewat tanggal kembali
      statusTampil:
        item.status === "dipinjam" &&
        item.tgl_kembali <
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date())
          ? "terlambat"
          : item.status,
    }),
  );

  // Mengubah tanggal menjadi format Indonesia
  const formatTanggal = (tanggal: string) =>
    new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Mengatur warna berdasarkan status
  const warnaStatus = (status: string) => {
    switch (status) {
      case "menunggu":
        return "bg-yellow-100 text-yellow-700";
      case "dipinjam":
        return "bg-blue-100 text-blue-700";
      case "dikembalikan":
        return "bg-green-100 text-green-700";
      case "ditolak":
        return "bg-red-100 text-red-700";
      case "terlambat":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Menampilkan nama status
  const namaStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigasi website */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          {/* Logo dan nama aplikasi */}
          <div>
            <Link href="/" className="text-2xl font-bold text-blue-900">
              AlatDKV
            </Link>
            <p className="text-xs text-slate-500">
              Sistem Peminjaman Alat Laboratorium DKV
            </p>
          </div>

          {/* Menu navigasi utama */}
          <div className="flex flex-wrap items-center gap-5 text-sm font-medium">
            <Link href="/" className="transition hover:text-blue-700">
              Beranda
            </Link>
            <Link href="/alat" className="text-blue-700">
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
              <div className="text-7xl">{ikonKategori(alat.kategori)}</div>
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

        {/* ===== Riwayat Peminjaman Alat ===== */}
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">
              Riwayat Peminjaman
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {riwayatPeminjaman.length} catatan
            </span>
          </div>

          {riwayatPeminjaman.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <div className="mb-3 text-4xl">📭</div>
              <p className="font-semibold text-slate-700">
                Belum ada riwayat peminjaman
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Alat ini belum pernah dipinjam.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-56rem text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5 font-semibold">No.</th>
                    <th className="px-5 py-3.5 font-semibold">Peminjam</th>
                    <th className="px-5 py-3.5 font-semibold">Kelas</th>
                    <th className="px-5 py-3.5 font-semibold">Jumlah</th>
                    <th className="px-5 py-3.5 font-semibold">Tgl Pinjam</th>
                    <th className="px-5 py-3.5 font-semibold">Tgl Kembali</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riwayatPeminjaman.map((item, index) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5 text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {item.peminjam}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {item.kelas}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {item.jumlah} unit
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {formatTanggal(item.tgl_pinjam)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {formatTanggal(item.tgl_kembali)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${warnaStatus(item.statusTampil)}`}
                        >
                          {namaStatus(item.statusTampil)}
                        </span>
                        {item.status === "dikembalikan" && item.kondisi_kembali && (
                          <p className="mt-1 text-xs text-slate-400">
                            Kondisi: {item.kondisi_kembali}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {/* Footer halaman */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © 2026 AlatDKV. Sistem Informasi Peminjaman Alat Laboratorium DKV.
      </footer>
    </main>
  );
}
