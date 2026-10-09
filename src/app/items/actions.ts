"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// state ที่ส่งกลับไปให้ฟอร์มแสดงผล (ใช้กับ useActionState)
export type FormState = {
  error?: string;
  values?: { name: string; description: string };
};

export async function createItem(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // ตรวจค่าฝั่ง server เสมอ เพราะผู้ใช้ข้ามการตรวจใน browser ได้
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const values = { name, description };

  if (!name) {
    return { error: "กรุณากรอกชื่อ", values };
  }
  if (name.length > 100) {
    return { error: "ชื่อต้องไม่เกิน 100 ตัวอักษร", values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .insert({ name, description: description || null });

  if (error) {
    return { error: `บันทึกไม่สำเร็จ: ${error.message}`, values };
  }

  // ล้าง cache ของหน้า list ให้เห็นรายการใหม่ แล้วพากลับไปหน้า list
  revalidatePath("/");
  redirect("/");
}
