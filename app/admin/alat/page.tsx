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

// Mengimpor action logout admin
import { logoutAdmin } from "../actions";

// Mengimpor action untuk toggle aktif dan hapus alat
import { toggleAktifAlat, hapusAlat } from "./actions";

// Mengimpor komponen form untuk kelola alat
import FormTambahAlat from "./FormTambahAlat";
import FormUbahStok from "./FormUbahStok";

// Mengatur halaman agar tidak diproses sebagai halaman statis
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
  alat_id: number;
  jumlah: number;
};

// Daftar kategori alat
const kategoriAlat = [
  { nilai: "kamera", label: "Kamera" },
  { nilai: "pencahayaan", label: "Pencahayaan" },
  { nilai: "audio", label: "Audio" },
  { nilai: "tablet", label: "Tablet" },
  { nilai: "aksesori", label: "Aksesori" },
];

// Mengubah kategori menjadi tulisan yang lebih rapi
function formatKategori(kategori: string) {
  return kategori
    .replaceAll("_", " ")
    .replace(/\b\w/g, (huruf) => huruf.toUpperCase());
}

// Menampilkan ikon berdasarkan kategori alat
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

// Halaman kelola alat admin
export default async function KelolaAlat() {
  // Memastikan halaman dijalankan saat ada permintaan pengguna
  await connection();

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

  // Mengambil semua data alat (termasuk yang nonaktif)
  const { data: alatData, error: errorAlat } = await supabaseAdmin
    .from("alat")
    .select("id, nama, kategori, stok, keterangan, aktif")
    .order("id", { ascending: true });

  if (errorAlat) {
    console.error("Gagal mengambil data alat:", errorAlat.message);
  }

  // Mengambil data peminjaman yang sedang berlangsung
  const { data: peminjamanData } = await supabaseAdmin
    .from("peminjaman_alat")
    .select("alat_id, jumlah")
    .eq("status", "dipinjam");

  // Mengubah hasil query menjadi array
  const daftarAlat = (alatData ?? []) as Alat[];
  const daftarPeminjaman = (peminjamanData ?? []) as Peminjaman[];

  // Menghitung jumlah alat yang sedang dipinjam berdasarkan ID
  const totalDipinjam = new Map<number, number>();

  daftarPeminjaman.forEach((item) => {
    const sebelumnya = totalDipinjam.get(item.alat_id) ?? 0;
    totalDipinjam.set(item.alat_id, sebelumnya + item.jumlah);
  });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ===== Header ===== */}
        <header className="mb-8 overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                Sistem Informasi Laboratorium DKV
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Kelola Alat
              </h1>
              <p className="mt-1 text-sm text-emerald-50/90">
                Tambah, ubah stok, aktifkan/nonaktifkan, dan hapus alat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                <span aria-hidden="true">←</span> Dashboard
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

        {/* ===== Form Tambah Alat ===== */}
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-lg">
              ➕
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Tambah Alat Baru
              </h2>
              <p className="text-xs text-slate-500">
                Isi formulir di bawah untuk menambahkan alat baru.
              </p>
            </div>
          </div>
          <FormTambahAlat kategoriAlat={kategoriAlat} />
        </section>

        {/* ===== Tabel Daftar Alat ===== */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg">
                📦
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Daftar Alat</h2>
                <p className="text-xs text-slate-500">
                  Seluruh alat laboratorium, termasuk yang nonaktif.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:self-auto">
              {daftarAlat.length} jenis alat
            </span>
          </div>

          {errorAlat ? (
            <div className="flex items-center gap-3 p-6 text-sm text-red-700">
              <span aria-hidden="true">⚠️</span>
              <span>Gagal memuat data alat: {errorAlat.message}</span>
            </div>
          ) : daftarAlat.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mb-3 text-4xl">📭</div>
              <p className="font-semibold text-slate-700">Belum ada alat</p>
              <p className="mt-1 text-sm text-slate-500">
                Tambahkan alat baru melalui formulir di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-56rem border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5 font-semibold">ID</th>
                    <th className="px-6 py-3.5 font-semibold">Nama Alat</th>
                    <th className="px-6 py-3.5 font-semibold">Kategori</th>
                    <th className="px-6 py-3.5 font-semibold">Stok</th>
                    <th className="px-6 py-3.5 font-semibold">Dipinjam</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daftarAlat.map((alat) => {
                    const dipinjam = totalDipinjam.get(alat.id) ?? 0;
                    const tersedia = Math.max(0, alat.stok - dipinjam);

                    return (
                      <tr
                        key={alat.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            #{alat.id}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base"
                              aria-hidden="true"
                            >
                              {ikonKategori(alat.kategori)}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {alat.nama}
                              </p>
                              {alat.keterangan && (
                                <p className="mt-1 max-w-[18rem] text-xs text-slate-500">
                                  {alat.keterangan}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {formatKategori(alat.kategori)}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {alat.stok} unit
                          </p>
                          <p className="text-xs text-emerald-600">
                            Tersedia: {tersedia}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                              dipinjam > 0
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {dipinjam} unit
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              alat.aktif
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                alat.aktif ? "bg-green-500" : "bg-slate-400"
                              }`}
                            />
                            {alat.aktif ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <FormUbahStok
                              id={alat.id}
                              stok={alat.stok}
                              sedangDipinjam={dipinjam}
                            />

                            <form action={toggleAktifFormAction}>
                              <input type="hidden" name="id" value={alat.id} />
                              <button
                                type="submit"
                                className={`w-full rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${
                                  alat.aktif
                                    ? "bg-amber-500 hover:bg-amber-600"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                              >
                                {alat.aktif ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                            </form>

                            <form action={hapusFormAction}>
                              <input type="hidden" name="id" value={alat.id} />
                              <button
                                type="submit"
                                className="w-full rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
                              >
                                Hapus
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// Membungkus action agar bisa dipakai sebagai form action
async function toggleAktifFormAction(formData: FormData) {
  "use server";
  await toggleAktifAlat({ success: true, message: "" }, formData);
}

async function hapusFormAction(formData: FormData) {
  "use server";
  await hapusAlat({ success: true, message: "" }, formData);
}
