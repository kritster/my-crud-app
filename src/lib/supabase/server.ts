import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// สร้าง Supabase client สำหรับใช้ฝั่ง server (Server Component / Server Action)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ถูกเรียกจาก Server Component ซึ่งตั้ง cookie ไม่ได้ — ข้ามได้เพราะแอปนี้ไม่มีระบบ login
          }
        },
      },
    }
  );
}
