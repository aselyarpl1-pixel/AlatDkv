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

  // Mengembalikan hasil pemeriksaan hak akses
  return Boolean(
    user &&
    emailAdmin &&
    user.email?.toLowerCase() === emailAdmin.toLowerCase(),
  );
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

  // Mengambil data pengajuan yang akan disetujui
  const { data: pengajuan, error: errorPengajuan } = await supabase
    .from("peminjaman_alat")
    .select("id, alat_id, jumlah, status")
    .eq("id", id)
    .maybeSingle();

  // Memeriksa apakah pengajuan berhasil ditemukan
  if (errorPengajuan || !pengajuan) {
    return {
      success: false,
      message: "Data pengajuan tidak ditemukan.",
    };
  }

  // Memastikan pengajuan masih menunggu persetujuan
  if (pengajuan.status !== "menunggu") {
    return {
      success: false,
      message: "Pengajuan ini sudah diproses sebelumnya.",
    };
  }

  // Mengambil informasi alat yang diajukan
  const { data: alat, error: errorAlat } = await supabase
    .from("alat")
    .select("stok, aktif")
    .eq("id", pengajuan.alat_id)
    .maybeSingle();

  // Memeriksa apakah alat tersedia dan masih aktif
  if (errorAlat || !alat || !alat.aktif) {
    return {
      success: false,
      message: "Alat tidak ditemukan atau sudah tidak aktif.",
    };
  }

  // Mengambil peminjaman yang statusnya masih dipinjam
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

  // Menghitung stok alat yang masih tersedia
  const stokTersedia = Math.max(0, alat.stok - totalDipinjam);

  // Memeriksa apakah stok mencukupi untuk pengajuan
  if (pengajuan.jumlah > stokTersedia) {
    return {
      success: false,
      message: `Stok tidak mencukupi. Stok tersedia: ${stokTersedia} unit.`,
    };
  }

  // Mengubah status pengajuan menjadi dipinjam
  const { data: hasilUpdate, error: errorUpdate } = await supabase
    .from("peminjaman_alat")
    .update({ status: "dipinjam" })
    .eq("id", id)
    .eq("status", "menunggu")
    .select("id")
    .maybeSingle();

  // Memeriksa hasil perubahan status
  if (errorUpdate || !hasilUpdate) {
    return {
      success: false,
      message: "Pengajuan gagal disetujui. Silakan periksa kembali.",
    };
  }

  // Memperbarui halaman dashboard admin
  revalidatePath("/admin");

  // Mengembalikan pesan keberhasilan
  return {
    success: true,
    message: "Pengajuan berhasil disetujui.",
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

  // Memperbarui halaman dashboard admin
  revalidatePath("/admin");

  // Mengembalikan pesan keberhasilan
  return {
    success: true,
    message: "Pengajuan berhasil ditolak.",
  };
}
