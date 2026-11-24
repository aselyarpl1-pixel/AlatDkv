"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// Tipe data hasil proses pengajuan
export type FormState = {
  success: boolean;
  message: string;
};

// Mengambil tanggal hari ini berdasarkan zona waktu Indonesia
function tanggalHariIni(): string {
  const bagian = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const tahun = bagian.find((item) => item.type === "year")?.value;
  const bulan = bagian.find((item) => item.type === "month")?.value;
  const hari = bagian.find((item) => item.type === "day")?.value;

  return `${tahun}-${bulan}-${hari}`;
}

// Menambahkan jumlah hari pada tanggal
function tambahHari(tanggal: string, jumlah: number): string {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  const hasil = new Date(Date.UTC(tahun, bulan - 1, hari + jumlah));

  return hasil.toISOString().slice(0, 10);
}

// Menghitung selisih dua tanggal
function selisihHari(tanggalAwal: string, tanggalAkhir: string): number {
  const awal = new Date(`${tanggalAwal}T00:00:00Z`).getTime();
  const akhir = new Date(`${tanggalAkhir}T00:00:00Z`).getTime();

  return (akhir - awal) / (1000 * 60 * 60 * 24);
}

// Memeriksa apakah format tanggal valid
function tanggalValid(tanggal: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return false;
  }

  const hasil = new Date(`${tanggal}T00:00:00Z`);

  return (
    !Number.isNaN(hasil.getTime()) &&
    hasil.toISOString().slice(0, 10) === tanggal
  );
}

// Proses pengajuan peminjaman alat
export async function ajukanPeminjaman(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Mengambil data dari formulir
  const alatId = Number(formData.get("alat_id"));
  const nama = String(formData.get("peminjam") ?? "").trim();
  const kelas = String(formData.get("kelas") ?? "").trim();
  const keperluan = String(formData.get("keperluan") ?? "").trim();
  const jumlah = Number(formData.get("jumlah"));
  const tglPinjam = String(formData.get("tgl_pinjam") ?? "");
  const tglKembali = String(formData.get("tgl_kembali") ?? "");

  // Memeriksa kelengkapan data
  if (
    !formData.get("alat_id") ||
    !nama ||
    !kelas ||
    !keperluan ||
    !formData.get("jumlah") ||
    !tglPinjam ||
    !tglKembali
  ) {
    return { success: false, message: "Semua kolom wajib diisi." };
  }

  // Memeriksa ID alat dan jumlah pinjaman
  if (!Number.isSafeInteger(alatId) || alatId < 1) {
    return { success: false, message: "Alat yang dipilih tidak valid." };
  }

  if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 5) {
    return {
      success: false,
      message: "Jumlah peminjaman harus antara 1 sampai 5 unit.",
    };
  }

  // Memeriksa panjang nama, kelas, dan keperluan
  if (nama.length < 3 || nama.length > 40) {
    return {
      success: false,
      message: "Nama harus terdiri dari 3 sampai 40 karakter.",
    };
  }

  if (kelas.length < 3 || kelas.length > 20) {
    return {
      success: false,
      message: "Kelas harus terdiri dari 3 sampai 20 karakter.",
    };
  }

  if (keperluan.length < 5 || keperluan.length > 120) {
    return {
      success: false,
      message: "Keperluan harus terdiri dari 5 sampai 120 karakter.",
    };
  }

  // Memeriksa format tanggal
  if (!tanggalValid(tglPinjam) || !tanggalValid(tglKembali)) {
    return { success: false, message: "Tanggal yang dimasukkan tidak valid." };
  }

  // Memeriksa tanggal minimal 14 hari dari hari ini
  const minimalTanggal = tambahHari(tanggalHariIni(), 14);

  if (tglPinjam < minimalTanggal) {
    return {
      success: false,
      message: "Tanggal pinjam harus minimal 14 hari dari hari ini.",
    };
  }

  // Memeriksa agar tanggal pinjam bukan Sabtu atau Minggu
  const hariPinjam = new Date(`${tglPinjam}T00:00:00Z`).getUTCDay();

  if (hariPinjam === 0 || hariPinjam === 6) {
    return {
      success: false,
      message: "Peminjaman hanya dapat dilakukan pada hari Senin sampai Jumat.",
    };
  }

  // Memeriksa tanggal kembali maksimal 3 hari setelah tanggal pinjam
  const selisihTanggal = selisihHari(tglPinjam, tglKembali);

  if (selisihTanggal < 0 || selisihTanggal > 3) {
    return {
      success: false,
      message: "Tanggal kembali maksimal 3 hari setelah tanggal pinjam.",
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Memastikan alat tersedia dan masih aktif
  const { data: alat, error: errorAlat } = await supabase
    .from("alat")
    .select("id, nama, stok, aktif")
    .eq("id", alatId)
    .eq("aktif", true)
    .maybeSingle();

  if (errorAlat || !alat) {
    return {
      success: false,
      message: "Alat tidak ditemukan atau sudah tidak aktif.",
    };
  }

  // Mengambil peminjaman yang sedang berlangsung untuk alat tersebut
  const { data: peminjamanAlat, error: errorStok } = await supabase
    .from("peminjaman_alat")
    .select("jumlah")
    .eq("alat_id", alatId)
    .eq("status", "dipinjam");

  if (errorStok) {
    console.error("Gagal memeriksa stok:", errorStok.message);

    return {
      success: false,
      message: "Gagal memeriksa stok alat. Silakan coba kembali.",
    };
  }

  // Menghitung stok yang sedang dipinjam
  const stokDipinjam = (peminjamanAlat ?? []).reduce(
    (total, item) => total + item.jumlah,
    0,
  );

  // Menghitung stok yang masih tersedia
  const stokTersedia = Math.max(0, alat.stok - stokDipinjam);

  if (jumlah > stokTersedia) {
    return {
      success: false,
      message: `Stok ${alat.nama} yang tersedia hanya ${stokTersedia} unit.`,
    };
  }

  // Mengambil peminjaman aktif milik siswa
  const { data: peminjamanSiswa, error: errorPeminjam } = await supabase
    .from("peminjaman_alat")
    .select("peminjam")
    .in("status", ["menunggu", "dipinjam"]);

  if (errorPeminjam) {
    console.error("Gagal memeriksa peminjaman siswa:", errorPeminjam.message);

    return {
      success: false,
      message: "Gagal memeriksa data peminjaman. Silakan coba kembali.",
    };
  }

  // Menghitung peminjaman aktif berdasarkan nama siswa
  const totalPeminjamanAktif = (peminjamanSiswa ?? []).filter(
    (item) => item.peminjam.trim().toLowerCase() === nama.toLowerCase(),
  ).length;

  // Membatasi maksimal dua peminjaman aktif
  if (totalPeminjamanAktif >= 2) {
    return {
      success: false,
      message: "Maksimal hanya 2 peminjaman aktif untuk satu nama siswa.",
    };
  }

  // Menyimpan pengajuan ke tabel Supabase
  const { error: errorSimpan } = await supabase.from("peminjaman_alat").insert({
    alat_id: alatId,
    peminjam: nama,
    kelas,
    keperluan,
    jumlah,
    tgl_pinjam: tglPinjam,
    tgl_kembali: tglKembali,
    status: "menunggu",
  });

  if (errorSimpan) {
    console.error("Gagal menyimpan pengajuan:", errorSimpan.message);

    return {
      success: false,
      message: "Pengajuan gagal disimpan. Silakan coba kembali.",
    };
  }

  // Mengirim pesan jika pengajuan berhasil
  return {
    success: true,
    message: "Pengajuan berhasil dikirim. Silakan tunggu persetujuan admin.",
  };
}
