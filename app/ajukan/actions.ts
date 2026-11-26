"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// Tipe data nilai formulir yang dikirim (untuk dipelihara saat galat)
export type NilaiForm = {
  alat_id: string;
  peminjam: string;
  kelas: string;
  keperluan: string;
  jumlah: string;
  tgl_pinjam: string;
  tgl_kembali: string;
};

// Tipe data galat per kolom
export type GalatForm = Partial<Record<keyof NilaiForm, string>>;

// Tipe data hasil proses pengajuan
export type FormState = {
  success: boolean;
  message: string;
  errors: GalatForm;
  values: NilaiForm;
  // Nomor peminjaman yang dihasilkan setelah pengajuan berhasil (untuk dicatat pengguna)
  nomorPeminjaman?: number | null;
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
  const alatId = String(formData.get("alat_id") ?? "");
  const nama = String(formData.get("peminjam") ?? "").trim();
  const kelas = String(formData.get("kelas") ?? "").trim();
  const keperluan = String(formData.get("keperluan") ?? "").trim();
  const jumlah = String(formData.get("jumlah") ?? "");
  const tglPinjam = String(formData.get("tgl_pinjam") ?? "");
  const tglKembali = String(formData.get("tgl_kembali") ?? "");

  // Menyimpan nilai yang dikirim untuk dipelihara saat galat
  const nilai: NilaiForm = {
    alat_id: alatId,
    peminjam: nama,
    kelas,
    keperluan,
    jumlah,
    tgl_pinjam: tglPinjam,
    tgl_kembali: tglKembali,
  };

  // Objek untuk menampung galat per kolom
  const errors: GalatForm = {};

  // Memeriksa kelengkapan data (galat per kolom)
  if (!alatId) errors.alat_id = "Alat wajib dipilih.";
  if (!nama) errors.peminjam = "Nama wajib diisi.";
  if (!kelas) errors.kelas = "Kelas wajib diisi.";
  if (!keperluan) errors.keperluan = "Keperluan wajib diisi.";
  if (!jumlah) errors.jumlah = "Jumlah wajib diisi.";
  if (!tglPinjam) errors.tgl_pinjam = "Tanggal pinjam wajib diisi.";
  if (!tglKembali) errors.tgl_kembali = "Tanggal kembali wajib diisi.";

  // Jika ada kolom kosong, kembalikan galat per kolom
  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Mohon lengkapi semua kolom yang ditandai.",
      errors,
      values: nilai,
    };
  }

  // Memeriksa ID alat
  const alatIdAngka = Number(alatId);
  if (!Number.isSafeInteger(alatIdAngka) || alatIdAngka < 1) {
    errors.alat_id = "Alat yang dipilih tidak valid.";
  }

  // Memeriksa jumlah pinjaman
  const jumlahAngka = Number(jumlah);
  if (!Number.isInteger(jumlahAngka) || jumlahAngka < 1 || jumlahAngka > 5) {
    errors.jumlah = "Jumlah harus antara 1 sampai 5 unit.";
  }

  // Memeriksa panjang nama, kelas, dan keperluan
  if (nama.length < 3 || nama.length > 40) {
    errors.peminjam = "Nama harus 3 sampai 40 karakter.";
  }

  if (kelas.length < 3 || kelas.length > 20) {
    errors.kelas = "Kelas harus 3 sampai 20 karakter.";
  }

  if (keperluan.length < 5 || keperluan.length > 120) {
    errors.keperluan = "Keperluan harus 5 sampai 120 karakter.";
  }

  // Memeriksa format tanggal
  if (!tanggalValid(tglPinjam)) {
    errors.tgl_pinjam = "Format tanggal pinjam tidak valid.";
  }

  if (!tanggalValid(tglKembali)) {
    errors.tgl_kembali = "Format tanggal kembali tidak valid.";
  }

  // Jika ada galat sejauh ini, kembalikan
  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Periksa kembali data yang Anda masukkan.",
      errors,
      values: nilai,
    };
  }

  // Memeriksa tanggal pinjam: tidak lampau dan paling jauh 14 hari ke depan
  const hariIni = tanggalHariIni();
  const maksimalTanggal = tambahHari(hariIni, 14);

  if (tglPinjam < hariIni) {
    errors.tgl_pinjam = "Tanggal pinjam tidak boleh tanggal lampau.";
  }

  if (tglPinjam > maksimalTanggal) {
    errors.tgl_pinjam = "Tanggal pinjam paling jauh 14 hari dari hari ini.";
  }

  // Memeriksa agar tanggal pinjam bukan Sabtu atau Minggu
  const hariPinjam = new Date(`${tglPinjam}T00:00:00Z`).getUTCDay();

  if (hariPinjam === 0 || hariPinjam === 6) {
    errors.tgl_pinjam = "Peminjaman hanya Senin sampai Jumat.";
  }

  // Memeriksa agar tanggal kembali bukan Sabtu atau Minggu
  const hariKembali = new Date(`${tglKembali}T00:00:00Z`).getUTCDay();

  if (hariKembali === 0 || hariKembali === 6) {
    errors.tgl_kembali = "Tanggal kembali hanya Senin sampai Jumat.";
  }

  // Memeriksa tanggal kembali tidak boleh sebelum tanggal pinjam, paling lama 3 hari
  const selisihTanggal = selisihHari(tglPinjam, tglKembali);

  if (selisihTanggal < 0) {
    errors.tgl_kembali = "Tanggal kembali tidak boleh sebelum tanggal pinjam.";
  } else if (selisihTanggal > 3) {
    errors.tgl_kembali = "Tanggal kembali maksimal 3 hari setelah pinjam.";
  }

  // Jika ada galat tanggal, kembalikan
  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Periksa kembali tanggal peminjaman Anda.",
      errors,
      values: nilai,
    };
  }

  // Membuat koneksi Supabase khusus server
  const supabase = createAdminClient();

  // Memastikan alat tersedia dan masih aktif
  const { data: alat, error: errorAlat } = await supabase
    .from("alat")
    .select("id, nama, stok, aktif")
    .eq("id", alatIdAngka)
    .eq("aktif", true)
    .maybeSingle();

  if (errorAlat || !alat) {
    errors.alat_id = "Alat tidak ditemukan atau sudah tidak aktif.";
    return {
      success: false,
      message: "Alat yang dipilih tidak tersedia.",
      errors,
      values: nilai,
    };
  }

  // Mengambil peminjaman yang sedang berlangsung untuk alat tersebut
  const { data: peminjamanAlat, error: errorStok } = await supabase
    .from("peminjaman_alat")
    .select("jumlah")
    .eq("alat_id", alatIdAngka)
    .eq("status", "dipinjam");

  if (errorStok) {
    console.error("Gagal memeriksa stok:", errorStok.message);

    return {
      success: false,
      message: "Gagal memeriksa stok alat. Silakan coba kembali.",
      errors: {},
      values: nilai,
    };
  }

  // Menghitung stok yang sedang dipinjam
  const stokDipinjam = (peminjamanAlat ?? []).reduce(
    (total, item) => total + item.jumlah,
    0,
  );

  // Menghitung stok yang masih tersedia
  const stokTersedia = Math.max(0, alat.stok - stokDipinjam);

  if (jumlahAngka > stokTersedia) {
    errors.jumlah = `Stok ${alat.nama} yang tersedia hanya ${stokTersedia} unit.`;
    return {
      success: false,
      message: "Jumlah peminjaman melebihi stok tersedia.",
      errors,
      values: nilai,
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
      errors: {},
      values: nilai,
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
      errors: {},
      values: nilai,
    };
  }

  // Menyimpan pengajuan ke tabel Supabase dan mengambil kembali nomor (id) yang dibuat
  const { data: hasilSimpan, error: errorSimpan } = await supabase
    .from("peminjaman_alat")
    .insert({
      alat_id: alatIdAngka,
      peminjam: nama,
      kelas,
      keperluan,
      jumlah: jumlahAngka,
      tgl_pinjam: tglPinjam,
      tgl_kembali: tglKembali,
      status: "menunggu",
    })
    .select("id")
    .single();

  if (errorSimpan || !hasilSimpan) {
    console.error("Gagal menyimpan pengajuan:", errorSimpan?.message);

    return {
      success: false,
      message: "Pengajuan gagal disimpan. Silakan coba kembali.",
      errors: {},
      values: nilai,
    };
  }

  // Mengirim pesan jika pengajuan berhasil, sertakan nomor peminjaman
  return {
    success: true,
    message: "Pengajuan berhasil dikirim. Silakan tunggu persetujuan admin.",
    errors: {},
    nomorPeminjaman: hasilSimpan.id,
    values: {
      alat_id: "",
      peminjam: "",
      kelas: "",
      keperluan: "",
      jumlah: "1",
      tgl_pinjam: "",
      tgl_kembali: "",
    },
  };
}
