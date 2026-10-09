import { createBrowserClient } from "@supabase/ssr";

// สร้าง Supabase client สำหรับใช้ฝั่ง browser (Client Component ที่มี "use client")
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
