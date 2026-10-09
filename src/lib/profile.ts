import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";

// ดึง profile ของคนที่ login อยู่ (ใช้ดู username และ role)
// คืน null ถ้ายังไม่ login หรือไม่มีแถวใน profiles
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  // เทียบเท่า SQL: SELECT * FROM profiles WHERE id = <id ของผู้ใช้> LIMIT 1;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .maybeSingle();

  return profile as Profile | null;
}
