import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/types/item";
import { updateItem } from "../../actions";
import ItemForm from "../../item-form";

type Props = PageProps<"/items/[id]/edit">;

// หัวข้อแสดงทันที ส่วนฟอร์มรอข้อมูลจาก Supabase อยู่ใน <Suspense>
// (cacheComponents บังคับให้ข้อมูลที่ไม่ cache ต้องอยู่ใน Suspense)
export default function EditItemPage({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold">แก้ไขรายการ</h1>
      <Suspense fallback={<p className="text-zinc-500">กำลังโหลด...</p>}>
        <EditItemForm params={params} />
      </Suspense>
    </main>
  );
}

async function EditItemForm({ params }: { params: Props["params"] }) {
  // Next.js 16: params เป็น Promise ต้อง await ก่อน
  const { id } = await params;

  // id ใน URL ต้องเป็นตัวเลขเท่านั้น เช่น /items/abc/edit ให้เป็น 404
  if (!/^\d+$/.test(id)) notFound();

  const supabase = await createClient();
  // เทียบเท่า SQL: SELECT * FROM items WHERE id = ... LIMIT 1;
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();

  if (error) {
    return (
      <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        เกิดข้อผิดพลาด: {error.message}
      </p>
    );
  }

  // ไม่พบแถวที่ id ตรงกัน → แสดงหน้า 404
  if (!data) notFound();
  const item = data as Item;

  return (
    <ItemForm
      action={updateItem.bind(null, item.id)}
      defaultValues={{
        name: item.name,
        description: item.description ?? "",
      }}
    />
  );
}
