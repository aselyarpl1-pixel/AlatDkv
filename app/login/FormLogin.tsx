"use client";

// Mengimpor useActionState untuk menghubungkan formulir dengan Server Action
import { useActionState } from "react";

// Mengimpor fungsi login dan tipe data hasil login
import { loginAdmin, type FormState } from "./actions";

// Membuat nilai awal untuk pesan kesalahan login
const initialState: FormState = {
  error: "",
  email: "",
};

// Membuat komponen formulir login admin
export default function FormLogin() {
  // Menghubungkan formulir dengan fungsi loginAdmin
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    // Formulir untuk mengirim email dan password ke Server Action
    <form action={formAction} key={state.email} className="space-y-5">
      {/* Input untuk memasukkan email admin */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Email Admin
        </label>

        <input
          type="email"
          name="email"
          required
          defaultValue={state.email}
          placeholder="Masukkan email admin"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
        />
      </div>

      {/* Input untuk memasukkan password admin */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Password
        </label>

        <input
          type="password"
          name="password"
          required
          placeholder="Masukkan password"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
        />
      </div>

      {/* Menampilkan pesan kesalahan jika login gagal */}
      {state.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      {/* Tombol untuk mengirim formulir login */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Masuk sebagai Admin"}
      </button>
    </form>
  );
}
