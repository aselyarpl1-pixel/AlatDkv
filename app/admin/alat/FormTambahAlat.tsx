"use client";

// Mengimpor useActionState untuk menghubungkan formulir dengan Server Action
import { useActionState } from "react";

// Mengimpor fungsi tambah alat dan tipe hasil
import { tambahAlat, type FormState } from "./actions";

// Membuat tipe data kategori
type Kategori = {
  nilai: string;
  label: string;
};

// Nilai awal untuk hasil proses
const initialState: FormState = {
  success: false,
  message: "",
};

// Komponen formulir untuk menambah alat baru
export default function FormTambahAlat({
  kategoriAlat,
}: {
  kategoriAlat: Kategori[];
}) {
  // Menghubungkan form dengan Server Action
  const [state, formAction, pending] = useActionState(
    tambahAlat,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {/* Input nama alat */}
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Nama Alat
        </label>
        <input
          type="text"
          name="nama"
          required
          minLength={3}
          maxLength={100}
          placeholder="Contoh: Kamera DSLR Canon EOS"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Pilihan kategori */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Kategori
        </label>
        <select
          name="kategori"
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">-- Pilih Kategori --</option>
          {kategoriAlat.map((item) => (
            <option key={item.nilai} value={item.nilai}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Input jumlah stok */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Stok Awal
        </label>
        <input
          type="number"
          name="stok"
          min={0}
          defaultValue={1}
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Input keterangan */}
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Keterangan <span className="font-normal text-gray-400">(opsional)</span>
        </label>
        <textarea
          name="keterangan"
          rows={2}
          maxLength={255}
          placeholder="Spesifikasi atau catatan alat..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Tombol submit */}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Tambah Alat"}
        </button>

        {/* Pesan hasil */}
        {state.message && (
          <p
            className={`mt-3 text-sm ${
              state.success ? "text-green-700" : "text-red-600"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
