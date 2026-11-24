import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import FormPengajuan from "./FormPengajuan";

// Mengizinkan halaman mengambil data secara dinamis
export const instant = false;

// Tipe data alat
type Alat = {
  id: number;
  nama: string;
  stok: number;
};

// Tipe data peminjaman
type Peminjaman = {
  alat_id: number;
  jumlah: number;
};

// Mengambil tanggal hari ini berdasarkan waktu Indonesia
function tanggalMinimal(): string {
  const bagian = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const tahun = bagian.find((item) => item.type === "year")?.value;
  const bulan = bagian.find((item) => item.type === "month")?.value;
  const hari = bagian.find((item) => item.type === "day")?.value;

  const hariIni = `${tahun}-${bulan}-${hari}`;

  // Menambahkan 14 hari dari tanggal hari ini
  const [y, m, d] = hariIni.split("-").map(Number);
  const hasil = new Date(Date.UTC(y, m - 1, d + 14));

  return hasil.toISOString().slice(0, 10);
}

// Halaman pengajuan peminjaman
export default async function AjukanPeminjaman() {
  // Membuat koneksi ke Supabase
  const supabase = createAdminClient();

  // Mengambil semua alat yang masih aktif
  const { data: alatData, error: errorAlat } = await supabase
    .from("alat")
    .select("id, nama, stok")
    .eq("aktif", true)
    .order("id", { ascending: true });

  // Memeriksa kesalahan pengambilan data alat
  if (errorAlat) {
    console.error("Gagal mengambil data alat:", errorAlat.message);

    throw new Error("Gagal memuat daftar alat.");
  }

  // Mengambil data alat yang sedang dipinjam
  const { data: peminjamanData, error: errorPeminjaman } = await supabase
    .from("peminjaman_alat")
    .select("alat_id, jumlah")
    .eq("status", "dipinjam");

  // Memeriksa kesalahan pengambilan data peminjaman
  if (errorPeminjaman) {
    console.error("Gagal mengambil data peminjaman:", errorPeminjaman.message);

    throw new Error("Gagal menghitung stok alat.");
  }

  // Mengubah hasil query menjadi array
  const daftarAlat = (alatData ?? []) as Alat[];
  const daftarPeminjaman = (peminjamanData ?? []) as Peminjaman[];

  // Menghitung jumlah alat yang sedang dipinjam berdasarkan ID
  const totalDipinjam = new Map<number, number>();

  daftarPeminjaman.forEach((item) => {
    const sebelumnya = totalDipinjam.get(item.alat_id) ?? 0;

    totalDipinjam.set(item.alat_id, sebelumnya + item.jumlah);
  });

  // Menghitung stok tersedia setiap alat
  const alatDenganStok = daftarAlat.map((item) => {
    const stokDipinjam = totalDipinjam.get(item.id) ?? 0;

    return {
      id: item.id,
      nama: item.nama,
      stokTersedia: Math.max(0, item.stok - stokDipinjam),
    };
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigasi website */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link href="/" className="text-2xl font-bold text-blue-900">
              AlatDKV
            </Link>

            <p className="text-xs text-slate-500">
              Sistem Peminjaman Alat Laboratorium DKV
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm font-medium">
            <Link href="/" className="hover:text-blue-700">
              Beranda
            </Link>

            <Link href="/alat" className="hover:text-blue-700">
              Daftar Alat
            </Link>

            <Link href="/cek" className="hover:text-blue-700">
              Cek Status
            </Link>

            <Link href="/login" className="hover:text-blue-700">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Judul halaman */}
      <section className="bg-blue-900 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
            Formulir Peminjaman
          </p>

          <h1 className="mt-3 text-4xl font-bold">Ajukan Peminjaman Alat</h1>

          <p className="mt-4 max-w-2xl leading-relaxed text-blue-100">
            Lengkapi formulir berikut untuk mengajukan peminjaman peralatan
            laboratorium DKV.
          </p>
        </div>
      </section>

      {/* Konten formulir */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Data Peminjaman</h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Pastikan semua informasi yang kamu masukkan sudah benar sebelum
            mengirim pengajuan.
          </p>

          {/* Menampilkan formulir pengajuan */}
          <div className="mt-8">
            <FormPengajuan
              daftarAlat={alatDenganStok}
              minimalTanggal={tanggalMinimal()}
            />
          </div>
        </div>

        {/* Informasi ketentuan peminjaman */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-bold text-blue-900">Ketentuan Peminjaman</h3>

          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-blue-800">
            <li>Tanggal pinjam minimal 14 hari dari hari ini.</li>
            <li>Peminjaman hanya pada hari Senin sampai Jumat.</li>
            <li>Lama peminjaman maksimal 3 hari.</li>
            <li>Jumlah peminjaman antara 1 sampai 5 unit.</li>
            <li>Maksimal 2 peminjaman aktif untuk satu nama siswa.</li>
            <li>Pengajuan menunggu persetujuan admin.</li>
          </ul>
        </div>
      </section>

      {/* Footer halaman */}
      <footer className="border-t border-slate-200 bg-white px-6 py-6 text-center">
        <p className="text-sm text-slate-500">
          © 2026 AlatDKV. Sistem Peminjaman Alat Laboratorium DKV.
        </p>
      </footer>
    </main>
  );
}
