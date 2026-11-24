// Mengimpor Link untuk navigasi ke halaman lain
import Link from "next/link";

// Mengimpor komponen formulir login admin
import FormLogin from "./FormLogin";

// Mengatur halaman agar tidak diproses sebagai halaman statis
export const instant = false;

// Membuat komponen halaman login admin
export default function LoginPage() {
  return (
    // Membuat area utama halaman login
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10">
      {/* Membuat kartu utama login */}
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        {/* Tombol untuk kembali ke halaman beranda */}
        <Link
          href="/"
          className="text-sm font-medium text-green-700 hover:underline"
        >
          ← Kembali ke Beranda
        </Link>

        {/* Bagian judul dan identitas halaman login */}
        <div className="mb-8 mt-8 text-center">
          {/* Ikon untuk halaman admin */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
            🛠️
          </div>

          {/* Judul halaman login */}
          <h1 className="text-2xl font-bold text-gray-900">Login Admin</h1>

          {/* Keterangan halaman login */}
          <p className="mt-2 text-sm text-gray-500">
            Masuk untuk mengelola peminjaman alat laboratorium DKV.
          </p>
        </div>

        {/* Menampilkan komponen formulir login */}
        <FormLogin />

        {/* Menampilkan keterangan pada bagian bawah halaman */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Sistem Informasi Peminjaman Alat DKV
        </p>
      </div>
    </main>
  );
}
