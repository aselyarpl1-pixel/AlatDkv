// Modul notifikasi: mengirim email saat status peminjaman berubah.
// Menggunakan Resend jika API key tersedia; jika tidak, notifikasi dicatat di log
// (struktur siap pakai, tinggal isi RESEND_API_KEY dan FROM_EMAIL di .env).

// Tipe data yang dibutuhkan untuk mengirim notifikasi
type DataNotifikasi = {
  namaPeminjam: string;
  namaAlat: string;
  jumlah: number;
  tglPinjam: string;
  tglKembali: string;
};

// Mengirim email notifikasi. Jika provider tidak dikonfigurasi,
// fungsi ini tidak melempar error sehingga alur admin tetap berjalan.
export async function kirimNotifikasiStatus(
  status: "dipinjam" | "ditolak" | "dikembalikan",
  data: DataNotifikasi,
  opsi?: { alasanTolak?: string; kondisi?: string },
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const toEmail = process.env.NOTIFIKASI_EMAIL;

  // Jika tidak ada konfigurasi email, cukup catat di log server.
  if (!apiKey || !fromEmail || !toEmail) {
    console.log(
      `[Notifikasi] Status peminjaman berubah menjadi "${status}" untuk ${data.namaPeminjam} (${data.namaAlat}, ${data.jumlah} unit). Email tidak dikirim karena RESEND_API_KEY/FROM_EMAIL/NOTIFIKASI_EMAIL belum diatur.`,
    );
    return;
  }

  // Menyusun subjek dan isi email berdasarkan status baru
  let subjek = "";
  let isi = "";

  switch (status) {
    case "dipinjam":
      subjek = `Peminjaman ${data.namaAlat} Disetujui`;
      isi = `Halo ${data.namaPeminjam},\n\nPengajuan peminjaman Anda untuk ${data.namaAlat} (${data.jumlah} unit) telah disetujui dan alat sudah diserahkan.\n\nTanggal pinjam: ${data.tglPinjam}\nTanggal kembali: ${data.tglKembali}\n\nHarap menjaga alat dan mengembalikan tepat waktu. Terima kasih.`;
      break;
    case "ditolak":
      subjek = `Pengajuan Peminjaman ${data.namaAlat} Ditolak`;
      isi = `Halo ${data.namaPeminjam},\n\nMohon maaf, pengajuan peminjaman Anda untuk ${data.namaAlat} (${data.jumlah} unit) ditolak.\n\nAlasan: ${opsi?.alasanTolak || "Tidak dijelaskan."}\n\nSilakan ajukan kembali atau hubungi admin laboratorium.`;
      break;
    case "dikembalikan":
      subjek = `Pengembalian ${data.namaAlat} Diterima`;
      isi = `Halo ${data.namaPeminjam},\n\nPengembalian ${data.namaAlat} (${data.jumlah} unit) telah diterima.\n\nKondisi alat: ${opsi?.kondisi || "Tidak dicatat"}\n\nTerima kasih telah menggunakan layanan peminjaman AlatDKV.`;
      break;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: subjek,
        text: isi,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[Notifikasi] Gagal mengirim email status "${status}": ${res.status} ${body}`,
      );
    }
  } catch (error) {
    console.error(
      `[Notifikasi] Kesalahan koneksi saat mengirim email status "${status}":`,
      error instanceof Error ? error.message : error,
    );
  }
}
