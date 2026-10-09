"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// state ที่ส่งกลับไปให้ฟอร์มแสดงผล (ใช้กับ useActionState)
export type FormState = {
  error?: string;
  values?: { name: string; description: string };
};

// อ่านและตรวจค่าจากฟอร์ม ใช้ร่วมกันทั้ง createItem และ updateItem
// ตรวจฝั่ง server เสมอ เพราะผู้ใช้ข้ามการตรวจใน browser ได้
function validate(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const values = { name, description };

  if (!name) return { error: "กรุณากรอกชื่อ", values };
  if (name.length > 100) return { error: "ชื่อต้องไม่เกิน 100 ตัวอักษร", values };
  return { values };
}

export async function createItem(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { error: invalid, values } = validate(formData);
  if (invalid) return { error: invalid, values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .insert({ name: values.name, description: values.description || null });

  if (error) {
    return { error: `บันทึกไม่สำเร็จ: ${error.message}`, values };
  }

  // ล้าง cache ของหน้า list ให้เห็นรายการใหม่ แล้วพากลับไปหน้า list
  revalidatePath("/");
  redirect("/");
}

// id ถูก bind มาจากหน้าแก้ไข: updateItem.bind(null, item.id)
export async function updateItem(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { error: invalid, values } = validate(formData);
  if (invalid) return { error: invalid, values };

  const supabase = await createClient();
  // .eq("id", id) = WHERE id = ... ต้องมีเสมอ ไม่งั้นจะพยายามแก้ทุกแถว
  // .select("id") ขอแถวที่ถูกแก้กลับมา เพื่อเช็กว่ามีแถวนั้นจริง
  const { data, error } = await supabase
    .from("items")
    .update({ name: values.name, description: values.description || null })
    .eq("id", id)
    .select("id");

  if (error) {
    return { error: `บันทึกไม่สำเร็จ: ${error.message}`, values };
  }
  if (data.length === 0) {
    return { error: "ไม่พบรายการนี้ (อาจถูกลบไปแล้ว)", values };
  }

  revalidatePath("/");
  redirect("/");
}
