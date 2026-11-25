# AlatDKV - Sistem Peminjaman Alat Laboratorium DKV

**AlatDKV** adalah aplikasi web untuk mengelola peminjaman alat laboratorium
Desain Komunikasi Visual (DKV). Siswa dapat melihat alat yang tersedia,
mengajukan peminjaman, dan mengecek status pengajuan. Admin dapat menyetujui,
menyerahkan, menolak, dan mengembalikan alat, serta mengelola data alat.

**Alamat Vercel:** https://alatdkv.vercel.app
> _Ganti dengan alamat Vercel Anda setelah melakukan deployment._

---

## 1. Cara Menjalankan di Laptop

1. Pastikan Node.js sudah terinstal (versi 18 atau lebih baru).
2. Klon repositori ini ke komputer Anda.
3. Buka terminal di folder proyek, lalu jalankan:

   ```bash
   npm install
   ```

4. Salin berkas `.env.local.example` menjadi `.env.local` dan isi variabel
   lingkungan berikut (tanpa menuliskan nilainya di sini):

   | Nama Variabel                    | Keterangan                                  |
   | -------------------------------- | ------------------------------------------- |
   | `SUPABASE_URL`                   | URL proyek Supabase Anda                    |
   | `SUPABASE_PUBLISHABLE_KEY`       | Kunci publik (anon) Supabase Anda           |
   | `SUPABASE_SECRET_KEY`            | Kunci rahasia (service_role) Supabase Anda  |
   | `NEXT_PUBLIC_SUPABASE_URL`       | Sama dengan `SUPABASE_URL` (untuk browser)  |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sama dengan `SUPABASE_PUBLISHABLE_KEY` |
   | `ADMIN_EMAIL`                    | Email akun admin di Supabase                |
   | `ADMIN_PASSWORD`                 | Kata sandi akun admin di Supabase           |

5. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

6. Buka [http://localhost:3000](http://localhost:3000) di browser.

7. Untuk membuat basis data, jalankan kode SQL di berkas `database.sql` pada
   SQL Editor Supabase Anda.

---

## 2. Daftar Halaman dan Fungsinya

| Rute            | Fungsi                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| `/`             | Beranda: menampilkan alat yang aktif beserta stok tersedia.           |
| `/alat`         | Daftar alat aktif dengan saringan kategori lewat URL `?kategori=`.    |
| `/alat/[id]`    | Detail alat: stok tersedia dan tombol ajukan peminjaman.              |
| `/ajukan`       | Formulir pengajuan peminjaman (alat, tanggal, jumlah, data peminjam). |
| `/cek`          | Mengecek status peminjaman berdasarkan nomor + nama peminjam.         |
| `/admin`        | Dashboard admin: daftar pengajuan, saring status (termasuk terlambat),|
|                 | serahkan / tolak / kembalikan alat.                                    |
| `/admin/alat`   | Kelola alat: tambah, ubah stok, aktif/nonaktif, hapus.                |
| `/login`        | Login admin.                                                           |

---

## 3. Aturan Bisnis dan Lapisan Penerapannya

| Aturan Bisnis                                                  | Lapisan Server | Lapisan Basis Data |
| -------------------------------------------------------------- | :------------: | :----------------: |
| Alat harus aktif untuk dapat dipinjam                          |       ✅       |         -          |
| Tanggal pinjam tidak lampau & maksimal 14 hari ke depan        |       ✅       |         -          |
| Tanggal pinjam & kembali bukan Sabtu/Minggu                    |       ✅       |         -          |
| Tanggal kembali maksimal 3 hari setelah pinjam                 |       ✅       |         ✅ (CHECK) |
| Jumlah pinjam 1-5 unit                                         |       ✅       |         ✅ (CHECK) |
| Nama peminjam 3-40 huruf                                       |       ✅       |         -          |
| Kelas 3-20 huruf                                               |       ✅       |         -          |
| Keperluan 5-120 huruf                                          |       ✅       |         -          |
| Satu peminjam maksimal 2 peminjaman aktif                      |       ✅       |         -          |
| Stok tersedia = stok - sedang dipinjam                         |       ✅       |         -          |
| Alat hanya diserahkan jika stok tersedia mencukupi             |       ✅       |         ✅ (trigger) |
| Penolakan wajib menyertakan alasan (min 5 huruf)              |       ✅       |         -          |
| Pengembalian wajib mencatat kondisi & tanggal otomatis         |       ✅       |         -          |
| Admin tidak boleh menurunkan stok di bawah yang dipinjam       |       ✅       |         ✅ (trigger) |
| Alat dengan riwayat peminjaman tidak dapat dihapus            |       ✅       |         -          |
| Status hanya: menunggu / dipinjam / dikembalikan / ditolak    |       ✅       |         ✅ (CHECK) |
| Kondisi kembali hanya: baik / rusak ringan / rusak berat      |       ✅       |         ✅ (CHECK) |

> Minimal satu aturan (`jumlah 1-5`, `status valid`, dan `stok tidak kurang dari
> yang dipinjam`) juga dijaga oleh basis data melalui **CHECK constraint** dan
> **trigger**, sehingga pelanggaran dari jalur mana pun tetap ditolak.

---

## 4. Keamanan

### Kunci yang Dipakai

- **Kunci publik (`SUPABASE_PUBLISHABLE_KEY`)** — dipakai oleh aplikasi di
  browser dan server untuk membaca data publik (alat aktif). Kunci ini **hanya
  boleh membaca**, tidak boleh mengubah.
- **Kunci rahasia (`SUPABASE_SECRET_KEY` / service_role)** — dipakai **hanya di
  sisi server** untuk semua operasi tulis (menambah peminjaman, mengubah status,
  mengelola alat). Kunci ini **tidak pernah** dikirim ke browser.

### Row Level Security (RLS)

RLS diaktifkan pada **kedua tabel**:

| Tabel             | Kunci Publik (anon)       | Kunci Rahasia (service_role) |
| ----------------- | ------------------------- | ---------------------------- |
| `alat`            | baca saja (SELECT)        | baca, tambah, ubah, hapus    |
| `peminjaman_alat` | **tidak ada** (ditolak)   | baca, tambah, ubah, hapus    |

Artinya, siapa pun yang memakai kunci publik **tidak dapat membaca** data
peminjaman (yang berisi nama, kelas, dan keperluan siswa).

### Perlindungan Fitur Admin

- Halaman `/admin` dan `/admin/alat` memeriksa sesi login sebelum menampilkan
  data. Pengunjung yang belum login dialihkan ke `/login`.
- Semua aksi admin (serahkan, tolak, kembalikan, kelola alat) memanggil
  `periksaAdmin()` di sisi server, sehingga tidak dapat dijalankan tanpa login
  meskipun formulirnya dipanggil langsung.

---

## 5. Masalah yang Ditemui dan Perbaikannya

**Masalah:** Tanggal pinjam awalnya harus *minimal 14 hari* dari hari ini.

- **Gejala:** Saat mengajukan peminjaman, pengguna tidak dapat memilih tanggal
  yang dekat dengan hari ini; form selalu menolak dengan pesan "Tanggal pinjam
  harus minimal 14 hari dari hari ini."
- **Penyebab:** Logika validasi di `app/ajukan/actions.ts` terbalik. Spesifikasi
  menyatakan "paling jauh 14 hari ke depan" (artinya *maksimal* 14 hari), tetapi
  kode memeriksa `tgl_pinjam < hariIni + 14` dan menolaknya.
- **Perbaikan:** Mengubah kondisi menjadi `tgl_pinjam >= hariIni` dan
  `tgl_pinjam <= hariIni + 14`, serta mengubah atribut `min`/`max` pada input
  tanggal di `FormPengajuan.tsx` agar pilihan di browser sudah sesuai.

---

## 6. Bagian yang Belum Selesai

- Belum ada notifikasi email saat status peminjaman berubah.
- Belum ada fitur cetak bukti peminjaman.
- Halaman `/cek` hanya menampilkan satu data berdasarkan nomor + nama; belum
  mendaftarkan semua riwayat satu peminjam.
- Riwayat peminjaman per alat belum ditampilkan di detail alat.

---

## Teknologi

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth)
