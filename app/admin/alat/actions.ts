"use server";

// Mengimpor koneksi Supabase untuk memeriksa sesi login
import { createClient } from "@/lib/supabase/server";

// Mengimpor koneksi Supabase khusus server
import { createAdminClient } from "@/lib/supabase/admin";

// Mengimpor revalidatePath untuk memperbarui halaman setelah data berubah
import { revalidatePath } from "next/cache";

// Membuat tipe data untuk hasil proses
export type FormState = {
  success: boolean;
  message: string;
};

// Daftar kategori alat yang valid
const kategoriValid = [
  "kamera",
  "pencahayaan",
  "audio",
  "tablet",
  "aksesori",
];

// Memeriksa apakah pengguna yang sedang login merupakan admin
async function periksaAdmin(): Promise<boolean> {
  // Membuat koneksi Supabase untuk memeriksa pengguna
  const supabase = await createClient();

  // Mengambil informasi pengguna yang sedang login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mengambil email admin dari konfigurasi lingkungan
  const emailAdmin = process.env.ADMIN_EMAIL;

  // Memeriksa apakah email pengguna sesuai dengan email admin
  return Boolean(
    user &&
      emailAdmin &&
      user.email?.toLowerCase() === emailAdmin.toLowerCase(),
  );
}

// Memperbarui halaman setelah data alat berubah
function perbaruiHalaman() {
  revalidatePath("/admin/alat");
  revalidatePath("/admin");
  revalidatePath("/alat");
  revalidatePath("/");
}

// Menghitung jumlah unit alat yang sedang dipinjam
async function hitungDipinjam(
  supabase: ReturnType<typeof createAdminClient>,
  alatId: number,
): Promise<number> {
  const { data, error } = await supabase
    .from("peminjaman_alat")
    .select("jumlah")
    .eq("alat_id", alatId)
    .eq("status", "dipinjam");

  if (error) {
    return 0;
  }

  return (data ?? []).reduce((total, item) => total + item.jumlah, 0);
}

// Membuat fungsi untuk menambah alat baru
export async function tambahAlat(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Memeriksa hak akses admin
  if (!(await periksaAdmin())) {
    return {
      success: false,
      message: "Kamu tidak memiliki akses admin.",
    };
  }

  // Mengambil data dari formulir
  const nama = String(formData.get("nama") || "").trim();
  const kategori = String(formData.get("kategori") || "").trim();
  const stok = Number(formData.get("stok"));
  const keterangan = String(formData.get("keterangan") || "").trim();

  // Memeriksa kelengkapan data
  if (!nama || !kategori) {
    return {
      success: false,
      message: "Nama dan kategori alat wajib diisi.",
    };
  }

  // Memeriksa panjang nama
  if (nama.length < 3 || nama.length > 100) {
    return {
      success: false,
      message: "Nama alat harus 3 sampai 100 karakter.",
    };
  }

  // Memeriksa kategori
  if (!kategoriValid.includes(kategori)) {
    return {
      success: false,
      message: "Kategori alat tidak valid.",
    };
  }

  // Memeriksa stok
  if (!Number.isInteger(stok) || stok < 0) {
    return {
      success: false,
      message: "Stok alat harus bilangan bulat tidak negatif.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Menyimpan alat baru ke database
  const { error } = await supabase.from("alat").insert({
    nama,
    kategori,
    stok,
    keterangan: keterangan || null,
    aktif: true,
  });

  // Memeriksa hasil penyimpanan
  if (error) {
    console.error("Gagal menambah alat:", error.message);

    return {
      success: false,
      message: "Gagal menambah alat. Silakan coba kembali.",
    };
  }

  // Memperbarui halaman yang berkaitan
  perbaruiHalaman();

  return {
    success: true,
    message: "Alat berhasil ditambahkan.",
  };
}

// Membuat fungsi untuk mengubah stok alat
export async function ubahStokAlat(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Memeriksa hak akses admin
  if (!(await periksaAdmin())) {
    return {
      success: false,
      message: "Kamu tidak memiliki akses admin.",
    };
  }

  // Mengambil ID dan stok baru dari formulir
  const id = Number(formData.get("id"));
  const stokBaru = Number(formData.get("stok"));

  // Memeriksa validitas ID
  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      message: "ID alat tidak valid.",
    };
  }

  // Memeriksa stok
  if (!Number.isInteger(stokBaru) || stokBaru < 0) {
    return {
      success: false,
      message: "Stok alat harus bilangan bulat tidak negatif.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Menghitung jumlah unit yang sedang dipinjam
  const sedangDipinjam = await hitungDipinjam(supabase, id);

  // Admin tidak boleh menurunkan stok di bawah jumlah yang sedang dipinjam
  if (stokBaru < sedangDipinjam) {
    return {
      success: false,
      message: `Stok tidak boleh kurang dari ${sedangDipinjam} unit (yang sedang dipinjam).`,
    };
  }

  // Memperbarui stok alat
  const { error } = await supabase
    .from("alat")
    .update({ stok: stokBaru })
    .eq("id", id);

  // Memeriksa hasil pembaruan
  if (error) {
    console.error("Gagal mengubah stok:", error.message);

    return {
      success: false,
      message: "Gagal mengubah stok alat. Silakan coba kembali.",
    };
  }

  // Memperbarui halaman yang berkaitan
  perbaruiHalaman();

  return {
    success: true,
    message: "Stok alat berhasil diperbarui.",
  };
}

// Membuat fungsi untuk mengaktifkan/menonaktifkan alat
export async function toggleAktifAlat(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Memeriksa hak akses admin
  if (!(await periksaAdmin())) {
    return {
      success: false,
      message: "Kamu tidak memiliki akses admin.",
    };
  }

  // Mengambil ID alat dari formulir
  const id = Number(formData.get("id"));

  // Memeriksa validitas ID
  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      message: "ID alat tidak valid.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Mengambil data alat saat ini
  const { data: alat, error: errorAlat } = await supabase
    .from("alat")
    .select("aktif")
    .eq("id", id)
    .maybeSingle();

  if (errorAlat || !alat) {
    return {
      success: false,
      message: "Alat tidak ditemukan.",
    };
  }

  // Membalik status aktif
  const { error } = await supabase
    .from("alat")
    .update({ aktif: !alat.aktif })
    .eq("id", id);

  if (error) {
    console.error("Gagal mengubah status:", error.message);

    return {
      success: false,
      message: "Gagal mengubah status alat. Silakan coba kembali.",
    };
  }

  // Memperbarui halaman yang berkaitan
  perbaruiHalaman();

  return {
    success: true,
    message: alat.aktif
      ? "Alat berhasil dinonaktifkan."
      : "Alat berhasil diaktifkan.",
  };
}

// Membuat fungsi untuk menghapus alat
export async function hapusAlat(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Memeriksa hak akses admin
  if (!(await periksaAdmin())) {
    return {
      success: false,
      message: "Kamu tidak memiliki akses admin.",
    };
  }

  // Mengambil ID alat dari formulir
  const id = Number(formData.get("id"));

  // Memeriksa validitas ID
  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      message: "ID alat tidak valid.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Memeriksa apakah alat memiliki riwayat peminjaman
  const { count, error: errorCek } = await supabase
    .from("peminjaman_alat")
    .select("id", { count: "exact", head: true })
    .eq("alat_id", id);

  if (errorCek) {
    console.error("Gagal memeriksa riwayat:", errorCek.message);

    return {
      success: false,
      message: "Gagal memeriksa data peminjaman. Silakan coba kembali.",
    };
  }

  // Alat yang punya riwayat peminjaman tidak bisa dihapus
  if (count && count > 0) {
    return {
      success: false,
      message:
        "Alat tidak dapat dihapus karena memiliki riwayat peminjaman. Nonaktifkan saja.",
    };
  }

  // Menghapus alat dari database
  const { error } = await supabase.from("alat").delete().eq("id", id);

  if (error) {
    console.error("Gagal menghapus alat:", error.message);

    return {
      success: false,
      message: "Gagal menghapus alat. Silakan coba kembali.",
    };
  }

  // Memperbarui halaman yang berkaitan
  perbaruiHalaman();

  return {
    success: true,
    message: "Alat berhasil dihapus.",
  };
}
