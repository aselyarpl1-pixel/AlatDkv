"use server";

// Mengimpor koneksi Supabase untuk memeriksa sesi login
import { createClient } from "@/lib/supabase/server";

// Mengimpor koneksi Supabase khusus server
import { createAdminClient } from "@/lib/supabase/admin";

// Mengimpor revalidatePath untuk memperbarui halaman setelah data berubah
import { revalidatePath } from "next/cache";

// Membuat tipe data untuk hasil proses pengajuan
export type FormState = {
  success: boolean;
  message: string;
};

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

// Memperbarui halaman setelah data peminjaman berubah
function perbaruiHalaman() {
  revalidatePath("/admin");
  revalidatePath("/alat");
  revalidatePath("/cek");
}

// Membuat fungsi untuk menyetujui pengajuan peminjaman
export async function setujuiPeminjaman(
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

  // Mengambil ID pengajuan dari formulir
  const id = Number(formData.get("id"));

  // Memastikan ID pengajuan valid
  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      message: "ID pengajuan tidak valid.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Mengubah status pengajuan menjadi disetujui
  const { data, error } = await supabase
    .from("peminjaman_alat")
    .update({ status: "disetujui" })
    .eq("id", id)
    .eq("status", "menunggu")
    .select("id")
    .maybeSingle();

  // Memeriksa hasil perubahan status
  if (error || !data) {
    return {
      success: false,
      message: "Pengajuan gagal disetujui atau sudah diproses.",
    };
  }

  // Memperbarui halaman yang berkaitan dengan peminjaman
  perbaruiHalaman();

  return {
    success: true,
    message: "Pengajuan berhasil disetujui.",
  };
}

// Membuat fungsi untuk menyerahkan alat kepada peminjam
export async function serahkanPeminjaman(
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

  // Mengambil ID pengajuan dari formulir
  const id = Number(formData.get("id"));

  // Memeriksa validitas ID
  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      message: "ID pengajuan tidak valid.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Mengambil data pengajuan yang sudah disetujui
  const { data: pengajuan, error: errorPengajuan } = await supabase
    .from("peminjaman_alat")
    .select("id, alat_id, jumlah, status")
    .eq("id", id)
    .maybeSingle();

  // Memeriksa apakah data pengajuan ditemukan
  if (errorPengajuan || !pengajuan) {
    return {
      success: false,
      message: "Data pengajuan tidak ditemukan.",
    };
  }

  // Memastikan pengajuan sudah disetujui
  if (pengajuan.status !== "disetujui") {
    return {
      success: false,
      message: "Pengajuan belum disetujui atau sudah diproses.",
    };
  }

  // Mengambil informasi alat yang akan diserahkan
  const { data: alat, error: errorAlat } = await supabase
    .from("alat")
    .select("stok, aktif")
    .eq("id", pengajuan.alat_id)
    .maybeSingle();

  // Memeriksa apakah alat masih aktif
  if (errorAlat || !alat || !alat.aktif) {
    return {
      success: false,
      message: "Alat tidak ditemukan atau sudah tidak aktif.",
    };
  }

  // Mengambil data alat yang sedang dipinjam
  const { data: peminjamanAktif, error: errorStok } = await supabase
    .from("peminjaman_alat")
    .select("jumlah")
    .eq("alat_id", pengajuan.alat_id)
    .eq("status", "dipinjam");

  // Memeriksa apakah data stok berhasil diambil
  if (errorStok) {
    return {
      success: false,
      message: "Gagal memeriksa stok alat.",
    };
  }

  // Menghitung jumlah alat yang sedang dipinjam
  const totalDipinjam = (peminjamanAktif || []).reduce(
    (total, item) => total + item.jumlah,
    0,
  );

  // Menghitung stok yang masih tersedia
  const stokTersedia = Math.max(0, alat.stok - totalDipinjam);

  // Memeriksa apakah stok mencukupi
  if (pengajuan.jumlah > stokTersedia) {
    return {
      success: false,
      message: `Stok tidak mencukupi. Stok tersedia: ${stokTersedia} unit.`,
    };
  }

  // Mengubah status menjadi dipinjam setelah alat diserahkan
  const { data: hasilUpdate, error: errorUpdate } = await supabase
    .from("peminjaman_alat")
    .update({ status: "dipinjam" })
    .eq("id", id)
    .eq("status", "disetujui")
    .select("id")
    .maybeSingle();

  // Memeriksa hasil perubahan status
  if (errorUpdate || !hasilUpdate) {
    return {
      success: false,
      message: "Penyerahan alat gagal atau sudah diproses.",
    };
  }

  // Memperbarui halaman yang berkaitan dengan peminjaman
  perbaruiHalaman();

  return {
    success: true,
    message: "Alat berhasil diserahkan kepada peminjam.",
  };
}

// Membuat fungsi untuk menolak pengajuan peminjaman
export async function tolakPeminjaman(
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

  // Mengambil ID pengajuan dan alasan penolakan
  const id = Number(formData.get("id"));
  const alasan = String(formData.get("alasan") || "").trim();

  // Memeriksa validitas ID pengajuan
  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      message: "ID pengajuan tidak valid.",
    };
  }

  // Memeriksa panjang alasan penolakan
  if (alasan.length < 5) {
    return {
      success: false,
      message: "Alasan penolakan minimal 5 karakter.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Mengubah status pengajuan menjadi ditolak
  const { data, error } = await supabase
    .from("peminjaman_alat")
    .update({
      status: "ditolak",
      alasan_tolak: alasan,
    })
    .eq("id", id)
    .eq("status", "menunggu")
    .select("id")
    .maybeSingle();

  // Memeriksa hasil penolakan
  if (error || !data) {
    return {
      success: false,
      message: "Pengajuan gagal ditolak atau sudah diproses.",
    };
  }

  // Memperbarui halaman yang berkaitan dengan peminjaman
  perbaruiHalaman();

  return {
    success: true,
    message: "Pengajuan berhasil ditolak.",
  };
}

// Membuat fungsi untuk memproses pengembalian alat
export async function kembalikanPeminjaman(
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

  // Mengambil ID dan kondisi alat dari formulir
  const id = Number(formData.get("id"));
  const kondisi = String(formData.get("kondisi") || "");

  // Memeriksa validitas ID
  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      message: "ID peminjaman tidak valid.",
    };
  }

  // Memeriksa kondisi alat yang dipilih
  const kondisiValid = ["baik", "rusak ringan", "rusak berat"];

  if (!kondisiValid.includes(kondisi)) {
    return {
      success: false,
      message: "Pilih kondisi alat yang valid.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Mengambil tanggal hari ini berdasarkan zona waktu Indonesia
  const tanggalKembali = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  // Memperbarui status dan kondisi alat yang dikembalikan
  const { data, error } = await supabase
    .from("peminjaman_alat")
    .update({
      status: "dikembalikan",
      kondisi_kembali: kondisi,
      tgl_dikembalikan: tanggalKembali,
    })
    .eq("id", id)
    .eq("status", "dipinjam")
    .select("id")
    .maybeSingle();

  // Memeriksa hasil proses pengembalian
  if (error || !data) {
    return {
      success: false,
      message: "Pengembalian gagal atau alat sudah dikembalikan.",
    };
  }

  // Memperbarui halaman yang berkaitan dengan peminjaman
  perbaruiHalaman();

  return {
    success: true,
    message: "Pengembalian alat berhasil diproses.",
  };
}
