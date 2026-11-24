import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Membuat koneksi Supabase dari sisi server
export async function createClient() {
  // Mengambil cookie pengguna
  const cookieStore = await cookies();

  // Mengambil URL dan Publishable Key dari file .env.local
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  // Memeriksa konfigurasi Supabase
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Konfigurasi Supabase belum lengkap.");
  }

  // Membuat koneksi ke Supabase
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // Mengambil semua cookie
      getAll() {
        return cookieStore.getAll();
      },

      // Menyimpan perubahan cookie
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie dapat diatur melalui Server Action atau proxy
        }
      },
    },
  });
}
