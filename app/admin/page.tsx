// Mengimpor Link untuk navigasi antarhalaman
import Link from "next/link";

// Mengimpor redirect untuk mengarahkan pengguna
import { redirect } from "next/navigation";

// Mengimpor connection agar halaman dirender saat ada permintaan
import { connection } from "next/server";

// Mengimpor koneksi Supabase untuk memeriksa sesi login
import { createClient } from "@/lib/supabase/server";

// Mengimpor koneksi Supabase khusus server untuk mengambil data
import { createAdminClient } from "@/lib/supabase/admin";

// Mengimpor komponen aksi penyerahan dan penolakan alat
import FormAksiPeminjaman from "./FormAksiPeminjaman";

// Mengimpor komponen formulir pengembalian alat
import FormPengembalian from "./FormPengembalian";

// Mengimpor action logout admin
import { logoutAdmin } from "./actions";

// Mengatur halaman agar tidak diproses sebagai halaman statis
export const instant = false;

// Membuat tipe data untuk pengajuan peminjaman
type Peminjaman = {
  id: number;
  alat_id: number;
  peminjam: string;
  kelas: string;
  keperluan: string;
  jumlah: number;
  tgl_pinjam: string;
  tgl_kembali: string;
  status: string;
  alasan_tolak: string | null;
  alat: {
    nama: string;
    kategori: string;
  } | null;
};

// Membuat daftar pilihan filter status (termasuk terlambat)
const daftarStatus = [
  { nilai: "semua", label: "Semua" },
  { nilai: "menunggu", label: "Menunggu" },
  { nilai: "dipinjam", label: "Dipinjam" },
  { nilai: "terlambat", label: "Terlambat" },
  { nilai: "dikembalikan", label: "Dikembalikan" },
  { nilai: "ditolak", label: "Ditolak" },
];

// Membuat fungsi untuk menentukan warna status peminjaman
function warnaStatus(status: string) {
  switch (status) {
    case "menunggu":
      return "bg-yellow-100 text-yellow-700";
    case "dipinjam":
      return "bg-blue-100 text-blue-700";
    case "terlambat":
      return "bg-orange-100 text-orange-700";
    case "dikembalikan":
      return "bg-green-100 text-green-700";
    case "ditolak":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

// Membuat fungsi untuk menampilkan nama status
function namaStatus(status: string) {
  switch (status) {
    case "menunggu":
      return "Menunggu";
    case "dipinjam":
      return "Dipinjam";
    case "terlambat":
      return "Terlambat";
    case "dikembalikan":
      return "Dikembalikan";
    case "ditolak":
      return "Ditolak";
    default:
      return status;
  }
}

// Mendapatkan tanggal hari ini berdasarkan zona waktu Indonesia Barat
function tanggalHariIni() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Menampilkan ikon berdasarkan kategori alat
function ikonKategori(kategori?: string | null) {
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

// Menentukan status yang ditampilkan (termasuk deteksi terlambat)
function statusTampil(data: Peminjaman) {
  if (data.status === "dipinjam" && data.tgl_kembali < tanggalHariIni()) {
    return "terlambat";
  }

  return data.status;
}

// Membuat halaman dashboard admin
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Memastikan halaman dijalankan saat ada permintaan pengguna
  await connection();

  // Mengambil parameter filter dari URL
  const params = await searchParams;
  const statusAktif = daftarStatus.some((item) => item.nilai === params.status)
    ? params.status || "semua"
    : "semua";

  // Membuat koneksi Supabase untuk memeriksa pengguna yang login
  const supabase = await createClient();

  // Mengambil informasi pengguna yang sedang login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mengambil email admin dari file .env.local
  const emailAdmin = process.env.ADMIN_EMAIL;

  // Memeriksa apakah pengguna sudah login dan merupakan admin
  if (
    !user ||
    !emailAdmin ||
    user.email?.toLowerCase() !== emailAdmin.toLowerCase()
  ) {
    // Mengarahkan pengguna yang tidak memiliki akses ke halaman login
    redirect("/login");
  }

  // Membuat koneksi Supabase khusus server untuk mengambil data
  const supabaseAdmin = createAdminClient();

  // Mengambil seluruh data pengajuan beserta informasi alat
  const { data, error } = await supabaseAdmin
    .from("peminjaman_alat")
    .select(
      `
      id,
      alat_id,
      peminjam,
      kelas,
      keperluan,
      jumlah,
      tgl_pinjam,
      tgl_kembali,
      status,
      alasan_tolak,
      alat (
        nama,
        kategori
      )
    `,
    )
    .order("dibuat", { ascending: false });

  // Mengubah data hasil query menjadi tipe data peminjaman
  const daftarPeminjaman = (data || []) as unknown as Peminjaman[];

  // Menghitung jumlah pengajuan berdasarkan status
  const totalPengajuan = daftarPeminjaman.length;

  const menunggu = daftarPeminjaman.filter(
    (item) => item.status === "menunggu",
  ).length;

  const dipinjam = daftarPeminjaman.filter(
    (item) =>
      item.status === "dipinjam" && item.tgl_kembali >= tanggalHariIni(),
  ).length;

  const terlambat = daftarPeminjaman.filter(
    (item) =>
      item.status === "dipinjam" && item.tgl_kembali < tanggalHariIni(),
  ).length;

  const dikembalikan = daftarPeminjaman.filter(
    (item) => item.status === "dikembalikan",
  ).length;

  const ditolak = daftarPeminjaman.filter(
    (item) => item.status === "ditolak",
  ).length;

  // Menyimpan jumlah setiap status untuk ditampilkan pada kartu
  const jumlahStatus: Record<string, number> = {
    semua: totalPengajuan,
    menunggu,
    dipinjam,
    terlambat,
    dikembalikan,
    ditolak,
  };

  // Menyaring data sesuai kategori status yang dipilih
  const dataTampil =
    statusAktif === "semua"
      ? daftarPeminjaman
      : statusAktif === "terlambat"
        ? daftarPeminjaman.filter(
            (item) =>
              item.status === "dipinjam" &&
              item.tgl_kembali < tanggalHariIni(),
          )
        : daftarPeminjaman.filter((item) => item.status === statusAktif);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ===== Header ===== */}
        <header className="mb-8 overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                Sistem Informasi Laboratorium DKV
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Dashboard Admin
              </h1>
              <p className="mt-1 text-sm text-emerald-50/90">
                Kelola pengajuan peminjaman alat laboratorium.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/alat"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                <span aria-hidden="true">📦</span> Kelola Alat
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <span aria-hidden="true">🏠</span> Beranda
              </Link>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
                >
                  <span aria-hidden="true">🚪</span> Keluar
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Pesan error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span aria-hidden="true">⚠️</span>
            <span>Gagal mengambil data pengajuan: {error.message}</span>
          </div>
        )}

        {/* ===== Stat Cards ===== */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              label: "Total",
              nilai: totalPengajuan,
              ikon: "📊",
              warna: "from-slate-500 to-slate-600",
            },
            {
              label: "Menunggu",
              nilai: menunggu,
              ikon: "⏳",
              warna: "from-amber-400 to-yellow-500",
            },
            {
              label: "Dipinjam",
              nilai: dipinjam,
              ikon: "📤",
              warna: "from-sky-400 to-blue-500",
            },
            {
              label: "Terlambat",
              nilai: terlambat,
              ikon: "⏰",
              warna: "from-orange-400 to-red-500",
            },
            {
              label: "Dikembalikan",
              nilai: dikembalikan,
              ikon: "✅",
              warna: "from-emerald-400 to-green-600",
            },
            {
              label: "Ditolak",
              nilai: ditolak,
              ikon: "❌",
              warna: "from-rose-400 to-red-600",
            },
          ].map((kartu) => (
            <div
              key={kartu.label}
              className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${kartu.warna} text-lg shadow-sm`}
              >
                <span aria-hidden="true">{kartu.ikon}</span>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {kartu.label}
              </p>
              <p className="mt-0.5 text-2xl font-bold text-slate-800">
                {kartu.nilai}
              </p>
            </div>
          ))}
        </section>

        {/* ===== Tabel Pengajuan ===== */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Daftar Pengajuan Peminjaman
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Pilih kategori untuk menyaring pengajuan berdasarkan status.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:self-auto">
              {dataTampil.length} data
            </span>
          </div>

          {/* Filter status */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 p-5">
            {daftarStatus.map((item) => (
              <Link
                key={item.nilai}
                href={
                  item.nilai === "semua"
                    ? "/admin"
                    : `/admin?status=${item.nilai}`
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  statusAktif === item.nilai
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    statusAktif === item.nilai
                      ? "bg-white/20"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {jumlahStatus[item.nilai]}
                </span>
              </Link>
            ))}
          </div>

          {/* Tabel */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-64rem border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5 font-semibold">No.</th>
                  <th className="px-6 py-3.5 font-semibold">Peminjam</th>
                  <th className="px-6 py-3.5 font-semibold">Alat</th>
                  <th className="px-6 py-3.5 font-semibold">Jumlah</th>
                  <th className="px-6 py-3.5 font-semibold">Tgl Pinjam</th>
                  <th className="px-6 py-3.5 font-semibold">Tgl Kembali</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataTampil.length > 0 ? (
                  dataTampil.map((item, index) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {index + 1}
                        </p>
                        <p className="text-xs text-slate-400">#{item.id}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {item.peminjam}
                        </p>
                        <p className="text-xs text-slate-500">{item.kelas}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base"
                            aria-hidden="true"
                          >
                            {ikonKategori(item.alat?.kategori)}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.alat?.nama || "Alat tidak ditemukan"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.alat?.kategori || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {item.jumlah} unit
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {item.tgl_pinjam}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {item.tgl_kembali}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${warnaStatus(
                            statusTampil(item),
                          )}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              statusTampil(item) === "menunggu"
                                ? "bg-yellow-500"
                                : statusTampil(item) === "dipinjam"
                                  ? "bg-blue-500"
                                  : statusTampil(item) === "terlambat"
                                    ? "bg-orange-500"
                                    : statusTampil(item) === "dikembalikan"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                            }`}
                          />
                          {namaStatus(statusTampil(item))}
                        </span>

                        {item.status === "ditolak" && item.alasan_tolak && (
                          <p className="mt-2 max-w-60 text-xs text-red-600">
                            Alasan: {item.alasan_tolak}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {item.status === "menunggu" ? (
                          <FormAksiPeminjaman id={item.id} />
                        ) : item.status === "dipinjam" ? (
                          <FormPengembalian id={item.id} />
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sudah diproses
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto max-w-xs">
                        <div className="mb-3 text-4xl">📭</div>
                        <p className="font-semibold text-slate-700">
                          Belum ada pengajuan
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Tidak ada pengajuan pada kategori ini.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
