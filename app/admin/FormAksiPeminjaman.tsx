"use client";

// Mengimpor useActionState untuk menghubungkan formulir dengan Server Action
import { useActionState } from "react";

// Mengimpor fungsi persetujuan, penolakan, dan penyerahan alat
import {
  setujuiPeminjaman,
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
  status: string;
};

// Membuat komponen aksi pengajuan peminjaman
export default function FormAksiPeminjaman({ id, status }: Props) {
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

  // Menghubungkan formulir penyerahan alat dengan Server Action
  const [stateSerahkan, formSerahkan, pendingSerahkan] = useActionState(
    serahkanPeminjaman,
    initialState,
  );

  // Jika status menunggu, tampilkan tombol setujui dan tolak
  if (status === "menunggu") {
    return (
      <div className="min-w-48 space-y-3">
        {/* Formulir untuk menyetujui pengajuan */}
        <form action={formSetujui}>
          <input type="hidden" name="id" value={id} />

          <button
            type="submit"
            disabled={pendingSetujui || pendingTolak}
            className="w-full rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {pendingSetujui ? "Memproses..." : "Setujui"}
          </button>
        </form>

        {/* Menampilkan hasil persetujuan */}
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
            disabled={pendingTolak || pendingSetujui}
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

  // Jika status disetujui, tampilkan tombol penyerahan alat
  if (status === "disetujui") {
    return (
      <div className="min-w-48 space-y-2">
        {/* Formulir untuk mencatat penyerahan alat */}
        <form action={formSerahkan}>
          <input type="hidden" name="id" value={id} />

          <button
            type="submit"
            disabled={pendingSerahkan}
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
      </div>
    );
  }

  // Menampilkan keterangan jika status sudah selesai atau sedang dipinjam
  return <span className="text-xs text-gray-400">Tidak ada tindakan</span>;
}
