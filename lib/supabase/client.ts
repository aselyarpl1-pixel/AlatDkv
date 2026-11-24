import { createBrowserClient } from "@supabase/ssr";

// Membuat koneksi Supabase untuk sisi browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
