"use client";

import { useActionState } from "react";
import { ajukanPeminjaman, type FormState } from "./actions";

// Tipe data alat untuk pilihan formulir
type AlatPilihan = {
  id: number;
  nama: string;
  stokTersedia: number;
};

// Nilai awal hasil pengajuan
const initialState: FormState = {
  success: false,
  message: "",
};

// Komponen formulir pengajuan peminjaman
export default function FormPengajuan({
  daftarAlat,
  minimalTanggal,
}: {
  daftarAlat: AlatPilihan[];
  minimalTanggal: string;
}) {
  // Menghubungkan formulir dengan proses server action
  const [state, formAction, sedangMengirim] = useActionState(
    ajukanPeminjaman,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Pilihan alat */}
      <div>
        <label htmlFor="alat_id" className="mb-2 block text-sm font-semibold">
          Pilih Alat
        </label>

        <select
          id="alat_id"
          name="alat_id"
          required
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
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
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          <p className="mt-1 text-xs text-slate-500">
            Minimal 14 hari dari hari ini dan hanya Senin–Jumat.
          </p>
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          <p className="mt-1 text-xs text-slate-500">
            Maksimal 3 hari setelah tanggal pinjam.
          </p>
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
          defaultValue="1"
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />

        <p className="mt-1 text-xs text-slate-500">
          Jumlah peminjaman minimal 1 dan maksimal 5 unit.
        </p>
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
          placeholder="Masukkan nama lengkap"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
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
          placeholder="Contoh: XI RPL 1"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Keperluan peminjaman */}
      <div>
        <label htmlFor="keperluan" className="mb-2 block text-sm font-semibold">
          Keperluan Peminjaman
        </label>

        <textarea
          id="keperluan"
          name="keperluan"
          minLength={5}
          maxLength={120}
          rows={4}
          required
          placeholder="Jelaskan tujuan peminjaman alat..."
          className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Pesan hasil pengajuan */}
      {state.message && (
        <div
          role="status"
          className={`rounded-xl p-4 text-sm font-medium ${
            state.success
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {state.message}
        </div>
      )}

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
