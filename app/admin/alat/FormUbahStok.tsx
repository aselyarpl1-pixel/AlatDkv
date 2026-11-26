"use client";

// Mengimpor useActionState untuk menghubungkan formulir dengan Server Action
import { useActionState } from "react";

// Mengimpor fungsi ubah stok dan tipe hasil
import { ubahStokAlat, type FormState } from "./actions";

// Nilai awal untuk hasil proses
const initialState: FormState = {
  success: false,
  message: "",
};

// Komponen formulir untuk mengubah stok alat
export default function FormUbahStok({
  id,
  stok,
  sedangDipinjam,
}: {
  id: number;
  stok: number;
  sedangDipinjam: number;
}) {
  // Menghubungkan form dengan Server Action
  const [state, formAction, pending] = useActionState(
    ubahStokAlat,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="id" value={id} />

      <div className="flex items-center gap-1">
        <input
          type="number"
          name="stok"
          min={sedangDipinjam}
          max={50}
          defaultValue={stok}
          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "..." : "Simpan"}
        </button>
      </div>

      {/* Pesan hasil */}
      {state.message && (
        <p
          className={`text-xs ${
            state.success ? "text-green-700" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
