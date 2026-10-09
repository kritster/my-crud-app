import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: proxy.ts ใช้แทน middleware.ts เดิม ทำงานก่อนทุก request ที่ตรงกับ matcher
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // ข้ามไฟล์ static และรูปภาพ ไม่ต้อง refresh session
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
