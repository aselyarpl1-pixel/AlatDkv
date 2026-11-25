"use client";

import { useActionState } from "react";
import { ajukanPeminjaman, type FormState, type NilaiForm } from "./actions";

// Tipe data alat untuk pilihan formulir
type AlatPilihan = {
  id: number;
  nama: string;
  stokTersedia: number;
};

// Nilai awal formulir (kosong)
const nilaiAwal: NilaiForm = {
  alat_id: "",
  peminjam: "",
  kelas: "",
  keperluan: "",
  jumlah: "1",
  tgl_pinjam: "",
  tgl_kembali: "",
};

// Nilai awal hasil pengajuan
const initialState: FormState = {
  success: false,
  message: "",
  errors: {},
  values: nilaiAwal,
};

// Komponen formulir pengajuan peminjaman
export default function FormPengajuan({
  daftarAlat,
  minimalTanggal,
  maksimalTanggal,
}: {
  daftarAlat: AlatPilihan[];
  minimalTanggal: string;
  maksimalTanggal: string;
}) {
  // Menghubungkan formulir dengan proses server action
  const [state, formAction, sedangMengirim] = useActionState(
    ajukanPeminjaman,
    initialState,
  );

  // Mengambil nilai dan galat dari state (pakai nilai awal jika belum ada)
  const nilai = state.values || nilaiAwal;
  const galat = state.errors || {};

  // Membuat kelas border berdasarkan ada/tidaknya galat
  const kelasBorder = (adaGalat: boolean) =>
    adaGalat
      ? "border-red-500 focus:border-red-500"
      : "border-slate-300 focus:border-blue-500";

  return (
    <form
      action={formAction}
      key={JSON.stringify(nilai)}
      className="space-y-6"
    >
      {/* Pesan umum jika ada galat atau berhasil */}
      {state.message && !state.success && (
        <div
          role="status"
          className="rounded-xl bg-red-100 p-4 text-sm font-medium text-red-700"
        >
          {state.message}
        </div>
      )}

      {state.success && state.message && (
        <div
          role="status"
          className="rounded-xl bg-green-100 p-4 text-sm font-medium text-green-700"
        >
          {state.message}
        </div>
      )}

      {/* Pilihan alat */}
      <div>
        <label htmlFor="alat_id" className="mb-2 block text-sm font-semibold">
          Pilih Alat
        </label>

        <select
          id="alat_id"
          name="alat_id"
          required
          defaultValue={nilai.alat_id}
          className={`w-full rounded-xl border bg-white px-4 py-3 outline-none ${kelasBorder(
            !!galat.alat_id,
          )}`}
        >
          <option value="" disabled>
            Pilih peralatan laboratorium
          </option>

          {daftarAlat.map((alat) => (
            <option
              key={alat.id}
              value={alat.id}
              disabled={alat.stokTersedia <= 0}
            >
              {alat.nama} — {alat.stokTersedia} unit tersedia
            </option>
          ))}
        </select>

        {/* Galat per kolom */}
        {galat.alat_id && (
          <p className="mt-1 text-xs text-red-600">{galat.alat_id}</p>
        )}
      </div>

      {/* Tanggal peminjaman */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tgl_pinjam"
            className="mb-2 block text-sm font-semibold"
          >
            Tanggal Pinjam
          </label>

          <input
            id="tgl_pinjam"
            name="tgl_pinjam"
            type="date"
            min={minimalTanggal}
            max={maksimalTanggal}
            required
            defaultValue={nilai.tgl_pinjam}
            className={`w-full rounded-xl border px-4 py-3 outline-none ${kelasBorder(
              !!galat.tgl_pinjam,
            )}`}
          />

          <p className="mt-1 text-xs text-slate-500">
            Hari ini sampai maksimal 14 hari ke depan, hanya Senin–Jumat.
          </p>

          {galat.tgl_pinjam && (
            <p className="mt-1 text-xs text-red-600">{galat.tgl_pinjam}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="tgl_kembali"
            className="mb-2 block text-sm font-semibold"
          >
            Tanggal Kembali
          </label>

          <input
            id="tgl_kembali"
            name="tgl_kembali"
            type="date"
            required
            defaultValue={nilai.tgl_kembali}
            className={`w-full rounded-xl border px-4 py-3 outline-none ${kelasBorder(
              !!galat.tgl_kembali,
            )}`}
          />

          <p className="mt-1 text-xs text-slate-500">
            Maksimal 3 hari setelah tanggal pinjam.
          </p>

          {galat.tgl_kembali && (
            <p className="mt-1 text-xs text-red-600">{galat.tgl_kembali}</p>
          )}
        </div>
      </div>

      {/* Jumlah alat */}
      <div>
        <label htmlFor="jumlah" className="mb-2 block text-sm font-semibold">
          Jumlah Alat
        </label>

        <input
          id="jumlah"
          name="jumlah"
          type="number"
          min="1"
          max="5"
          required
          defaultValue={nilai.jumlah}
          className={`w-full rounded-xl border px-4 py-3 outline-none ${kelasBorder(
            !!galat.jumlah,
          )}`}
        />

        <p className="mt-1 text-xs text-slate-500">
          Jumlah peminjaman minimal 1 dan maksimal 5 unit.
        </p>

        {galat.jumlah && (
          <p className="mt-1 text-xs text-red-600">{galat.jumlah}</p>
        )}
      </div>

      {/* Nama peminjam */}
      <div>
        <label htmlFor="peminjam" className="mb-2 block text-sm font-semibold">
          Nama Lengkap
        </label>

        <input
          id="peminjam"
          name="peminjam"
          type="text"
          minLength={3}
          maxLength={40}
          required
          defaultValue={nilai.peminjam}
          placeholder="Masukkan nama lengkap"
          className={`w-full rounded-xl border px-4 py-3 outline-none ${kelasBorder(
            !!galat.peminjam,
          )}`}
        />

        {galat.peminjam && (
          <p className="mt-1 text-xs text-red-600">{galat.peminjam}</p>
        )}
      </div>

      {/* Kelas peminjam */}
      <div>
        <label htmlFor="kelas" className="mb-2 block text-sm font-semibold">
          Kelas
        </label>

        <input
          id="kelas"
          name="kelas"
          type="text"
          minLength={3}
          maxLength={20}
          required
          defaultValue={nilai.kelas}
          placeholder="Contoh: XI RPL 1"
          className={`w-full rounded-xl border px-4 py-3 outline-none ${kelasBorder(
            !!galat.kelas,
          )}`}
        />

        {galat.kelas && (
          <p className="mt-1 text-xs text-red-600">{galat.kelas}</p>
        )}
      </div>

      {/* Keperluan peminjaman */}
      <div>
        <label
          htmlFor="keperluan"
          className="mb-2 block text-sm font-semibold"
        >
          Keperluan Peminjaman
        </label>

        <textarea
          id="keperluan"
          name="keperluan"
          minLength={5}
          maxLength={120}
          rows={4}
          required
          defaultValue={nilai.keperluan}
          placeholder="Jelaskan tujuan peminjaman alat..."
          className={`w-full resize-y rounded-xl border px-4 py-3 outline-none ${kelasBorder(
            !!galat.keperluan,
          )}`}
        />

        {galat.keperluan && (
          <p className="mt-1 text-xs text-red-600">{galat.keperluan}</p>
        )}
      </div>

      {/* Tombol kirim pengajuan */}
      <button
        type="submit"
        disabled={sedangMengirim}
        className="w-full rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {sedangMengirim ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
      </button>
    </form>
  );
}
