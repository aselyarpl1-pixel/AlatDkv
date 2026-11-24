"use client";

// Mengimpor useActionState untuk menghubungkan formulir dengan Server Action
import { useActionState } from "react";

// Mengimpor fungsi persetujuan dan penolakan
import { setujuiPeminjaman, tolakPeminjaman, type FormState } from "./actions";

// Membuat nilai awal untuk hasil proses pengajuan
const initialState: FormState = {
  success: false,
  message: "",
};

// Membuat tipe data untuk properti komponen
type Props = {
  id: number;
};

// Membuat komponen aksi pengajuan peminjaman
export default function FormAksiPeminjaman({ id }: Props) {
  // Menghubungkan formulir persetujuan dengan Server Action
  const [stateSetujui, formSetujui, pendingSetujui] = useActionState(
    setujuiPeminjaman,
    initialState,
  );

  // Menghubungkan formulir penolakan dengan Server Action
  const [stateTolak, formTolak, pendingTolak] = useActionState(
    tolakPeminjaman,
    initialState,
  );

  return (
    <div className="min-w-48 space-y-3">
      {/* Menampilkan tombol persetujuan pengajuan */}
      <form action={formSetujui}>
        {/* Mengirim ID pengajuan ke Server Action */}
        <input type="hidden" name="id" value={id} />

        <button
          type="submit"
          disabled={pendingSetujui || pendingTolak}
          className="w-full rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pendingSetujui ? "Memproses..." : "Setujui"}
        </button>
      </form>

      {/* Menampilkan hasil proses persetujuan */}
      {stateSetujui.message && (
        <p
          className={`text-xs ${
            stateSetujui.success ? "text-green-700" : "text-red-600"
          }`}
        >
          {stateSetujui.message}
        </p>
      )}

      {/* Formulir untuk memasukkan alasan penolakan */}
      <form action={formTolak} className="space-y-2">
        {/* Mengirim ID pengajuan ke Server Action */}
        <input type="hidden" name="id" value={id} />

        {/* Input alasan penolakan */}
        <textarea
          name="alasan"
          required
          minLength={5}
          maxLength={120}
          rows={2}
          placeholder="Alasan penolakan..."
          className="w-full rounded-lg border border-gray-300 p-2 text-xs outline-none focus:border-red-500"
        />

        {/* Tombol untuk menolak pengajuan */}
        <button
          type="submit"
          disabled={pendingTolak || pendingSetujui}
          className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pendingTolak ? "Memproses..." : "Tolak Pengajuan"}
        </button>
      </form>

      {/* Menampilkan hasil proses penolakan */}
      {stateTolak.message && (
        <p
          className={`text-xs ${
            stateTolak.success ? "text-green-700" : "text-red-600"
          }`}
        >
          {stateTolak.message}
        </p>
      )}
    </div>
  );
}
