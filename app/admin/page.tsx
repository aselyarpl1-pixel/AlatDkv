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

// Mengimpor komponen aksi persetujuan, penolakan, dan penyerahan alat
import FormAksiPeminjaman from "./FormAksiPeminjaman";

// Mengimpor komponen formulir pengembalian alat
import FormPengembalian from "./FormPengembalian";

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

// Membuat daftar pilihan filter status
const daftarStatus = [
  { nilai: "semua", label: "Semua" },
  { nilai: "menunggu", label: "Menunggu" },
  { nilai: "disetujui", label: "Disetujui" },
  { nilai: "dipinjam", label: "Dipinjam" },
  { nilai: "dikembalikan", label: "Dikembalikan" },
  { nilai: "ditolak", label: "Ditolak" },
];

// Membuat fungsi untuk menentukan warna status peminjaman
function warnaStatus(status: string) {
  switch (status) {
    case "menunggu":
      return "bg-yellow-100 text-yellow-700";
    case "disetujui":
      return "bg-indigo-100 text-indigo-700";
    case "dipinjam":
      return "bg-blue-100 text-blue-700";
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
    case "disetujui":
      return "Disetujui";
    case "dipinjam":
      return "Dipinjam";
    case "dikembalikan":
      return "Dikembalikan";
    case "ditolak":
      return "Ditolak";
    default:
      return status;
  }
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

  const disetujui = daftarPeminjaman.filter(
    (item) => item.status === "disetujui",
  ).length;

  const dipinjam = daftarPeminjaman.filter(
    (item) => item.status === "dipinjam",
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
    disetujui,
    dipinjam,
    dikembalikan,
    ditolak,
  };

  // Menyaring data sesuai kategori status yang dipilih
  const dataTampil =
    statusAktif === "semua"
      ? daftarPeminjaman
      : daftarPeminjaman.filter((item) => item.status === statusAktif);

  return (
    // Bagian utama halaman dashboard admin
    <main className="min-h-screen bg-gray-50 px-5 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Bagian header dashboard admin */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-green-700">
              SISTEM INFORMASI LABORATORIUM DKV
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Dashboard Admin
            </h1>

            <p className="mt-2 text-gray-500">
              Kelola pengajuan peminjaman alat laboratorium.
            </p>
          </div>

          {/* Tombol kembali ke halaman utama */}
          <Link
            href="/"
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Kembali ke Beranda
          </Link>
        </div>

        {/* Menampilkan pesan jika pengambilan data gagal */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Gagal mengambil data pengajuan: {error.message}
          </div>
        )}

        {/* Bagian ringkasan jumlah pengajuan */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Kartu total pengajuan */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Pengajuan</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              {totalPengajuan}
            </h2>
          </div>

          {/* Kartu pengajuan menunggu */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Menunggu</p>
            <h2 className="mt-3 text-3xl font-bold text-yellow-600">
              {menunggu}
            </h2>
          </div>

          {/* Kartu pengajuan disetujui */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Disetujui</p>
            <h2 className="mt-3 text-3xl font-bold text-indigo-600">
              {disetujui}
            </h2>
          </div>

          {/* Kartu alat yang sedang dipinjam */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Sedang Dipinjam</p>
            <h2 className="mt-3 text-3xl font-bold text-blue-600">
              {dipinjam}
            </h2>
          </div>

          {/* Kartu alat yang sudah dikembalikan */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Sudah Dikembalikan</p>
            <h2 className="mt-3 text-3xl font-bold text-green-600">
              {dikembalikan}
            </h2>
          </div>

          {/* Kartu pengajuan yang ditolak */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Ditolak</p>
            <h2 className="mt-3 text-3xl font-bold text-red-600">{ditolak}</h2>
          </div>
        </div>

        {/* Bagian daftar pengajuan peminjaman */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Judul tabel pengajuan */}
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900">
              Daftar Pengajuan Peminjaman
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Pilih kategori untuk melihat pengajuan berdasarkan status.
            </p>
          </div>

          {/* Menu filter kategori status */}
          <div className="flex flex-wrap gap-2 border-b border-gray-100 p-5">
            {daftarStatus.map((item) => (
              <Link
                key={item.nilai}
                href={
                  item.nilai === "semua"
                    ? "/admin"
                    : `/admin?status=${item.nilai}`
                }
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  statusAktif === item.nilai
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
                <span className="ml-2">({jumlahStatus[item.nilai]})</span>
              </Link>
            ))}
          </div>

          {/* Membuat tabel dapat digeser pada layar kecil */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left text-sm">
              {/* Bagian kepala tabel */}
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-4">No.</th>
                  <th className="px-6 py-4">Peminjam</th>
                  <th className="px-6 py-4">Alat</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Tanggal Pinjam</th>
                  <th className="px-6 py-4">Tanggal Kembali</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>

              {/* Bagian isi tabel */}
              <tbody className="divide-y divide-gray-100">
                {/* Memeriksa apakah terdapat data sesuai filter */}
                {dataTampil.length > 0 ? (
                  dataTampil.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {/* Nomor urut dan ID pengajuan */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {index + 1}
                        </p>
                        <p className="text-xs text-gray-400">ID: {item.id}</p>
                      </td>

                      {/* Informasi peminjam */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {item.peminjam}
                        </p>
                        <p className="text-xs text-gray-500">{item.kelas}</p>
                      </td>

                      {/* Nama dan kategori alat */}
                      <td className="px-6 py-4 text-gray-700">
                        <p className="font-semibold">
                          {item.alat?.nama || "Alat tidak ditemukan"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.alat?.kategori || "-"}
                        </p>
                      </td>

                      {/* Jumlah alat yang diajukan */}
                      <td className="px-6 py-4 text-gray-700">
                        {item.jumlah} unit
                      </td>

                      {/* Tanggal peminjaman */}
                      <td className="px-6 py-4 text-gray-700">
                        {item.tgl_pinjam}
                      </td>

                      {/* Tanggal pengembalian */}
                      <td className="px-6 py-4 text-gray-700">
                        {item.tgl_kembali}
                      </td>

                      {/* Status pengajuan dengan warna sesuai status */}
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${warnaStatus(
                            item.status,
                          )}`}
                        >
                          {namaStatus(item.status)}
                        </span>

                        {/* Menampilkan alasan jika pengajuan ditolak */}
                        {item.status === "ditolak" && item.alasan_tolak && (
                          <p className="mt-2 max-w-48 text-xs text-red-600">
                            Alasan: {item.alasan_tolak}
                          </p>
                        )}
                      </td>

                      {/* Kolom aksi sesuai status pengajuan */}
                      <td className="px-6 py-4">
                        {item.status === "menunggu" ||
                        item.status === "disetujui" ? (
                          // Menampilkan aksi persetujuan, penolakan, atau penyerahan
                          <FormAksiPeminjaman
                            id={item.id}
                            status={item.status}
                          />
                        ) : item.status === "dipinjam" ? (
                          // Menampilkan formulir pengembalian alat
                          <FormPengembalian id={item.id} />
                        ) : (
                          // Menampilkan keterangan jika sudah selesai
                          <span className="text-xs text-gray-400">
                            Sudah diproses
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  // Menampilkan pesan jika kategori belum memiliki data
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Belum ada pengajuan pada kategori ini.
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
