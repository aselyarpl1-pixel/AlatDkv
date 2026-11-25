"use server";

// Mengimpor koneksi Supabase dari sisi server
import { createClient } from "@/lib/supabase/server";

// Mengimpor redirect untuk mengarahkan pengguna setelah login
import { redirect } from "next/navigation";

// Membuat tipe data untuk pesan hasil login
export type FormState = {
  error: string;
  email: string;
};

// Membuat fungsi untuk memproses login admin
export async function loginAdmin(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Mengambil email dan password dari formulir
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  // Memeriksa apakah email dan password sudah diisi
  if (!email || !password) {
    return { error: "Email dan password wajib diisi.", email };
  }

  // Mengambil email admin dari file .env.local
  const emailAdmin = process.env.ADMIN_EMAIL;

  // Memeriksa apakah email admin sudah dikonfigurasi
  if (!emailAdmin) {
    return { error: "Email admin belum dikonfigurasi.", email };
  }

  // Membuat koneksi Supabase untuk proses autentikasi
  const supabase = await createClient();

  // Memeriksa email dan password menggunakan Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Menampilkan pesan jika proses login gagal
  if (error) {
    return { error: "Email atau password salah.", email };
  }

  // Memeriksa apakah akun yang masuk sesuai dengan email admin
  if (data.user.email?.toLowerCase() !== emailAdmin.toLowerCase()) {
    // Mengeluarkan akun yang bukan admin
    await supabase.auth.signOut();

    return { error: "Akun ini tidak memiliki akses admin.", email };
  }

  // Mengarahkan admin ke halaman pengelolaan
  redirect("/admin");
}
