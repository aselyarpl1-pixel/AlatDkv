// Menandai file sebagai Client Component
"use client";

// Mengimpor useActionState untuk mengelola formulir
import { useActionState } from "react";

// Mengimpor fungsi untuk memproses pengembalian alat
import { kembalikanPeminjaman, type FormState } from "./actions";

// Membuat kondisi awal formulir
const initialState: FormState = {
  success: false,
  message: "",
};

// Membuat tipe data untuk ID peminjaman
type Props = {
  id: number;
};

// Membuat komponen formulir pengembalian alat
export default function FormPengembalian({ id }: Props) {
  // Menghubungkan formulir dengan Server Action
  const [state, formAction, pending] = useActionState(
    kembalikanPeminjaman,
    initialState,
  );

  return (
    <div className="min-w-44 space-y-3">
      {/* Formulir untuk mencatat kondisi alat saat dikembalikan */}
      <form action={formAction} className="space-y-3">
        {/* Mengirim ID peminjaman ke Server Action */}
        <input type="hidden" name="id" value={id} />

        {/* Pilihan kondisi alat */}
        <div>
          <label
            htmlFor={`kondisi-${id}`}
            className="mb-1 block text-xs font-semibold text-gray-700"
          >
            Kondisi Alat
          </label>

          <select
            id={`kondisi-${id}`}
            name="kondisi"
            required
            defaultValue=""
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:border-green-500"
          >
            <option value="" disabled>
              Pilih kondisi alat
            </option>

            <option value="baik">Baik</option>
            <option value="rusak ringan">Rusak Ringan</option>
            <option value="rusak berat">Rusak Berat</option>
          </select>
        </div>

        {/* Tombol untuk memproses pengembalian */}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Memproses..." : "Konfirmasi Pengembalian"}
        </button>

        {/* Menampilkan pesan hasil proses */}
        {state.message && (
          <p
            className={`text-xs ${
              state.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
