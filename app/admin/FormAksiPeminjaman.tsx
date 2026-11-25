"use client";

// Mengimpor useActionState untuk menghubungkan formulir dengan Server Action
import { useActionState } from "react";

// Mengimpor fungsi penolakan dan penyerahan alat
import {
  tolakPeminjaman,
  serahkanPeminjaman,
  type FormState,
} from "./actions";

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
  // Menghubungkan formulir penyerahan alat dengan Server Action
  const [stateSerahkan, formSerahkan, pendingSerahkan] = useActionState(
    serahkanPeminjaman,
    initialState,
  );

  // Menghubungkan formulir penolakan dengan Server Action
  const [stateTolak, formTolak, pendingTolak] = useActionState(
    tolakPeminjaman,
    initialState,
  );

  return (
    <div className="min-w-48 space-y-3">
      {/* Formulir untuk menyerahkan alat kepada peminjam */}
      <form action={formSerahkan}>
        <input type="hidden" name="id" value={id} />

        <button
          type="submit"
          disabled={pendingSerahkan || pendingTolak}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pendingSerahkan ? "Memproses..." : "Serahkan Alat"}
        </button>
      </form>

      {/* Menampilkan hasil penyerahan alat */}
      {stateSerahkan.message && (
        <p
          className={`text-xs ${
            stateSerahkan.success ? "text-green-700" : "text-red-600"
          }`}
        >
          {stateSerahkan.message}
        </p>
      )}

      {/* Formulir untuk memasukkan alasan penolakan */}
      <form action={formTolak} className="space-y-2">
        <input type="hidden" name="id" value={id} />

        <textarea
          name="alasan"
          required
          minLength={5}
          maxLength={120}
          rows={2}
          placeholder="Alasan penolakan..."
          className="w-full rounded-lg border border-gray-300 p-2 text-xs outline-none focus:border-red-500"
        />

        <button
          type="submit"
          disabled={pendingTolak || pendingSerahkan}
          className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pendingTolak ? "Memproses..." : "Tolak Pengajuan"}
        </button>
      </form>

      {/* Menampilkan hasil penolakan */}
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
