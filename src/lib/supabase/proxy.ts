import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// หน้าที่เข้าได้โดยไม่ต้อง login ส่วนหน้าอื่นทั้งหมดต้อง login ก่อน
const PUBLIC_PATHS = ["/login", "/signup"];

// เรียกจาก src/proxy.ts ทุก request
// 1) refresh session ของ Supabase แล้วเขียน cookie ใหม่กลับไปทั้ง request และ response
// 2) ถ้ายังไม่ login แต่เข้าหน้าที่ต้อง login ให้ redirect ไป /login
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // ใส่ cookie ใหม่ใน request เพื่อให้ Server Component ที่ทำงานต่อจากนี้เห็น session ล่าสุด
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // และใส่ใน response เพื่อให้ browser เก็บ cookie ใหม่
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ห้ามมีโค้ดอื่นคั่นระหว่าง createServerClient กับ getClaims()
  // getClaims() ตรวจ token และ refresh session ที่หมดอายุให้อัตโนมัติ
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user && !PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ต้องคืน response ตัวนี้ (ที่มี cookie ใหม่) เสมอ ไม่งั้น session จะหลุด
  return response;
}
