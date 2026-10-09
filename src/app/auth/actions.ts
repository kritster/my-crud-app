"use server";

import type { AuthError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// state ที่ส่งกลับไปให้ฟอร์มแสดงผล (ใช้กับ useActionState)
// ไม่ส่ง password กลับไป ผู้ใช้ต้องพิมพ์ใหม่ทุกครั้ง
export type AuthState = {
  error?: string;
  values?: { username?: string; email: string };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// แปลง error ของ Supabase Auth เป็นข้อความภาษาไทย โดยดูจาก error.code
function toThaiMessage(error: AuthError) {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "อีเมลนี้ถูกใช้สมัครแล้ว";
    case "invalid_credentials":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "weak_password":
      return "รหัสผ่านไม่ปลอดภัยพอ กรุณาตั้งรหัสผ่านใหม่";
    case "email_address_invalid":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "ลองบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
  }
  // trigger สร้างแถวใน profiles ล้มเหลว (เช่น username ซ้ำ) Supabase ส่งมาแค่ข้อความนี้
  if (error.message.includes("Database error saving new user")) {
    return "สมัครไม่สำเร็จ อาจเป็นเพราะ username นี้ถูกใช้แล้ว";
  }
  return `เกิดข้อผิดพลาด: ${error.message}`;
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { username, email };

  // ตรวจฝั่ง server เสมอ เพราะผู้ใช้ข้ามการตรวจใน browser ได้
  if (username.length < 3 || username.length > 30) {
    return { error: "username ต้องมี 3-30 ตัวอักษร", values };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "รูปแบบอีเมลไม่ถูกต้อง", values };
  }
  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", values };
  }

  const supabase = await createClient();
  // options.data จะถูกเก็บใน raw_user_meta_data ซึ่ง trigger ใช้สร้างแถวใน profiles
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) return { error: toThaiMessage(error), values };

  // ปิด Confirm email ไว้ สมัครเสร็จจึงได้ session ทันที เข้าหน้าแรกได้เลย
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน", values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: toThaiMessage(error), values };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
