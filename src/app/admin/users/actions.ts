"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// แปลงข้อความ error จากฟังก์ชัน admin_delete_user (ดู supabase/schema.sql) เป็นภาษาไทย
function toThaiMessage(message: string) {
  if (message.includes("not_admin")) return "คุณไม่มีสิทธิ์ลบผู้ใช้";
  if (message.includes("cannot_delete_self")) return "ลบบัญชีของตัวเองไม่ได้";
  if (message.includes("user_not_found")) return "ไม่พบผู้ใช้นี้ (อาจถูกลบไปแล้ว)";
  return `ลบไม่สำเร็จ: ${message}`;
}

// เรียกจากปุ่มลบโดยตรง (ไม่ผ่านฟอร์ม) จึงรับแค่ id
// การเช็กว่าเป็น admin ทำในฐานข้อมูล (ฟังก์ชัน admin_delete_user) จึงเรียกตรง ๆ ก็ข้ามไม่ได้
export async function deleteUser(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_user", { target: id });

  if (error) return { error: toThaiMessage(error.message) };

  // ล้าง cache ของหน้าที่แสดงข้อมูล user และ items ของ user นั้น
  revalidatePath("/admin/users");
  revalidatePath("/");
  return {};
}
