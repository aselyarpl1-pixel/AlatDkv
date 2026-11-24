import "server-only";
import { createClient } from "@supabase/supabase-js";

// Membuat koneksi Supabase khusus untuk proses server
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  // Memeriksa konfigurasi Supabase
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Konfigurasi Supabase Admin belum lengkap.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
