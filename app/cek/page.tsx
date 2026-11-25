import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

// Mengimpor komponen tombol cetak bukti peminjaman
import TombolCetak from "./TombolCetak";

// Mengizinkan halaman mengambil data secara dinamis
export const instant = false;

// Tipe data peminjaman
type Peminjaman = {
  id: number;
  peminjam: string;
  keperluan: string;
  jumlah: number;
  tgl_pinjam: string;
  tgl_kembali: string;
  status: string;
  alasan_tolak: string | null;
  kondisi_kembali: string | null;
  tgl_dikembalikan: string | null;
  alat: {
    nama: string;
  } | null;
};

// Mengubah tanggal menjadi format Indonesia
function formatTanggal(tanggal: string) {
  return new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Mendapatkan tanggal hari ini berdasarkan zona waktu Indonesia Barat
function tanggalHariIni() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Menentukan status peminjaman yang akan ditampilkan
function statusPeminjaman(data: Peminjaman) {
  // Jika masih dipinjam dan tanggal kembali sudah lewat
  if (data.status === "dipinjam" && data.tgl_kembali < tanggalHariIni()) {
    return "terlambat";
  }

  return data.status;
}

// Mengatur warna berdasarkan status
function warnaStatus(status: string) {
  switch (status) {
    case "menunggu":
      return "bg-yellow-100 text-yellow-700";

    case "dipinjam":
      return "bg-blue-100 text-blue-700";

    case "dikembalikan":
      return "bg-green-100 text-green-700";

    case "ditolak":
      return "bg-red-100 text-red-700";

    case "terlambat":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

// Halaman cek status peminjaman
export default async function CekPeminjaman({
  searchParams,
}: {
  searchParams: Promise<{
    nomor?: string;
    peminjam?: string;
  }>;
}) {
  // Mengambil data pencarian dari URL
  const params = await searchParams;

  const nomor = params.nomor?.trim() || "";
  const peminjam = params.peminjam?.trim() || "";

  let dataPeminjaman: Peminjaman | null = null;
  let riwayatPeminjaman: Peminjaman[] = [];
  let pesanError = "";

  // Memeriksa data jika formulir sudah dikirim
  if (nomor || peminjam) {
    // Memeriksa kelengkapan data
    if (!nomor || !peminjam || !/^[1-9]\d*$/.test(nomor)) {
      pesanError = "Masukkan nomor peminjaman dan nama peminjam dengan benar.";
    } else {
      try {
        // Membuat koneksi ke Supabase
        const supabase = createAdminClient();

        // Mencari peminjaman berdasarkan nomor dan nama
        const { data, error } = await supabase
          .from("peminjaman_alat")
          .select(
            `
            id,
            peminjam,
            keperluan,
            jumlah,
            tgl_pinjam,
            tgl_kembali,
            status,
            alasan_tolak,
            kondisi_kembali,
            tgl_dikembalikan,
            alat (
              nama
            )
          `,
          )
          .eq("id", nomor)
          .ilike("peminjam", peminjam)
          .maybeSingle();

        // Memeriksa hasil pencarian
        if (error) {
          console.error("Gagal mengambil data peminjaman:", error.message);
          pesanError = "Terjadi kesalahan saat mencari data peminjaman.";
        } else if (data) {
          // Memastikan nama cocok tanpa membedakan huruf besar dan kecil
          if (data.peminjam.toLowerCase() === peminjam.toLowerCase()) {
            dataPeminjaman = data as unknown as Peminjaman;

            // Mengambil seluruh riwayat peminjaman milik nama yang sama
            const { data: riwayat, error: errorRiwayat } = await supabase
              .from("peminjaman_alat")
              .select(
                `
                id,
                peminjam,
                keperluan,
                jumlah,
                tgl_pinjam,
                tgl_kembali,
                status,
                alasan_tolak,
                kondisi_kembali,
                tgl_dikembalikan,
                alat (
                  nama
                )
              `,
              )
              .ilike("peminjam", peminjam)
              .order("id", { ascending: false });

            if (!errorRiwayat && riwayat) {
              riwayatPeminjaman = riwayat as unknown as Peminjaman[];
            }
          } else {
            pesanError = "Nomor atau nama peminjam tidak cocok.";
          }
        } else {
          pesanError = "Nomor atau nama peminjam tidak cocok.";
        }
      } catch (error) {
        console.error("Kesalahan koneksi Supabase:", error);
        pesanError = "Koneksi ke database gagal. Silakan coba lagi.";
      }
    }
  }

  // Menghitung status yang ditampilkan
  const status = dataPeminjaman ? statusPeminjaman(dataPeminjaman) : "";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navigasi halaman */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-blue-700">
            AlatDKV
          </Link>

          <div className="flex flex-wrap gap-5 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-700">
              Beranda
            </Link>

            <Link href="/alat" className="hover:text-blue-700">
              Daftar Alat
            </Link>

            <Link href="/cek" className="text-blue-700">
              Cek Peminjaman
            </Link>

            <Link href="/login" className="hover:text-blue-700">
              Login Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Bagian utama halaman */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10 text-center">
          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            Layanan Peminjaman
          </span>

          <h1 className="mt-5 text-3xl font-bold text-slate-800">
            Cek Status Peminjaman
          </h1>

          <p className="mt-3 text-slate-500">
            Masukkan nomor peminjaman dan nama untuk melihat status pengajuan.
          </p>
        </div>

        {/* Form pencarian peminjaman */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <form action="/cek" method="GET" className="space-y-5">
            <div>
              <label
                htmlFor="nomor"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nomor Peminjaman
              </label>

              <input
                type="number"
                id="nomor"
                name="nomor"
                min="1"
                required
                defaultValue={nomor}
                placeholder="Masukkan nomor peminjaman"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="peminjam"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nama Peminjam
              </label>

              <input
                type="text"
                id="peminjam"
                name="peminjam"
                required
                defaultValue={peminjam}
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Cek Status Peminjaman
            </button>
          </form>
        </div>

        {/* Menampilkan pesan jika data tidak ditemukan */}
        {pesanError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {pesanError}
          </div>
        )}

        {/* Menampilkan hasil pencarian */}
        {dataPeminjaman && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-800">
                Detail Peminjaman
              </h2>

              <div className="flex items-center gap-2">
                <TombolCetak />
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${warnaStatus(status)}`}
                >
                  {status}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Nomor Peminjaman</p>
                <p className="mt-1 font-semibold text-slate-800">
                  #{dataPeminjaman.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Nama Peminjam</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {dataPeminjaman.peminjam}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Nama Alat</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {dataPeminjaman.alat?.nama || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Jumlah</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {dataPeminjaman.jumlah} unit
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Tanggal Pinjam</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {formatTanggal(dataPeminjaman.tgl_pinjam)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Tanggal Kembali</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {formatTanggal(dataPeminjaman.tgl_kembali)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-slate-500">Keperluan</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {dataPeminjaman.keperluan}
                </p>
              </div>

              {dataPeminjaman.tgl_dikembalikan && (
                <div>
                  <p className="text-sm text-slate-500">Tanggal Dikembalikan</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatTanggal(dataPeminjaman.tgl_dikembalikan)}
                  </p>
                </div>
              )}

              {dataPeminjaman.kondisi_kembali && (
                <div>
                  <p className="text-sm text-slate-500">Kondisi Alat</p>
                  <p className="mt-1 font-semibold capitalize text-slate-800">
                    {dataPeminjaman.kondisi_kembali}
                  </p>
                </div>
              )}
            </div>

            {/* Menampilkan alasan jika peminjaman ditolak */}
            {dataPeminjaman.status === "ditolak" &&
              dataPeminjaman.alasan_tolak && (
                <div className="mt-6 rounded-xl bg-red-50 p-4">
                  <p className="font-semibold text-red-700">Alasan Penolakan</p>

                  <p className="mt-1 text-sm text-red-600">
                    {dataPeminjaman.alasan_tolak}
                  </p>
                </div>
              )}

            {/* Memberikan informasi jika peminjaman terlambat */}
            {status === "terlambat" && (
              <div className="mt-6 rounded-xl bg-orange-50 p-4 text-sm text-orange-700">
                Masa peminjaman sudah melewati tanggal pengembalian. Silakan
                segera mengembalikan alat kepada admin laboratorium.
              </div>
            )}
          </div>
        )}

        {/* Menampilkan seluruh riwayat peminjaman milik peminjam yang sama */}
        {riwayatPeminjaman.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm print:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Riwayat Peminjaman
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {riwayatPeminjaman.length} catatan
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Seluruh pengajuan peminjaman yang pernah diajukan oleh{" "}
              <span className="font-semibold text-slate-700">
                {riwayatPeminjaman[0]?.peminjam}
              </span>
              .
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-160 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="py-3 pr-4 font-semibold">No.</th>
                    <th className="py-3 pr-4 font-semibold">Alat</th>
                    <th className="py-3 pr-4 font-semibold">Jumlah</th>
                    <th className="py-3 pr-4 font-semibold">Tgl Pinjam</th>
                    <th className="py-3 pr-4 font-semibold">Tgl Kembali</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riwayatPeminjaman.map((item, index) => {
                    const statusItem = statusPeminjaman(item);
                    const adalahDataSaatIni =
                      dataPeminjaman && item.id === dataPeminjaman.id;

                    return (
                      <tr
                        key={item.id}
                        className={
                          adalahDataSaatIni ? "bg-blue-50/60" : "hover:bg-slate-50"
                        }
                      >
                        <td className="py-3 pr-4 text-slate-500">
                          {index + 1}
                          {adalahDataSaatIni && (
                            <span className="ml-1 text-[10px] font-semibold text-blue-600">
                              (ini)
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-medium text-slate-800">
                          {item.alat?.nama || "-"}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {item.jumlah} unit
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {formatTanggal(item.tgl_pinjam)}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {formatTanggal(item.tgl_kembali)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${warnaStatus(statusItem)}`}
                          >
                            {statusItem}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Footer halaman */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500 print:hidden">
        © 2026 AlatDKV. Sistem Informasi Peminjaman Alat Laboratorium DKV.
      </footer>
    </main>
  );
}
