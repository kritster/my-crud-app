import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/types/item";
import DeleteButton from "./items/delete-button";
import { signOut } from "./auth/actions";

// ส่วนหัวแสดงทันที ส่วนรายการรอข้อมูลจาก Supabase อยู่ใน <Suspense>
// (cacheComponents บังคับให้ข้อมูลที่ไม่ cache ต้องอยู่ใน Suspense)
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-4 flex min-h-9 items-center justify-end gap-3 text-sm">
        <Suspense fallback={null}>
          <CurrentUser />
        </Suspense>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">รายการ Items</h1>
        <Link
          href="/items/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          เพิ่มรายการ
        </Link>
      </div>

      <Suspense fallback={<p className="text-zinc-500">กำลังโหลด...</p>}>
        <ItemList />
      </Suspense>
    </main>
  );
}

// แสดง username ของคนที่ login อยู่ พร้อมปุ่มออกจากระบบ
// (proxy redirect คนที่ยังไม่ login ไป /login ก่อนแล้ว จึงมาถึงตรงนี้เฉพาะคนที่ login)
async function CurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  // เทียบเท่า SQL: SELECT username FROM profiles WHERE id = <id ของผู้ใช้> LIMIT 1;
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", claims.sub)
    .maybeSingle();

  return (
    <>
      <span className="text-zinc-600 dark:text-zinc-400">
        สวัสดี{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {profile?.username ?? claims.email}
        </span>
      </span>
      {/* ฟอร์มเรียก Server Action ได้ตรง ๆ ไม่ต้องเป็น Client Component */}
      <form action={signOut}>
        <button
          type="submit"
          className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ออกจากระบบ
        </button>
      </form>
    </>
  );
}

// Server Component: ดึงข้อมูลบน server ทุกครั้งที่มีคนเปิดหน้า
async function ItemList() {
  const supabase = await createClient();

  // เทียบเท่า SQL: SELECT * FROM items ORDER BY created_at DESC;
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as Item[];

  if (error) {
    return (
      <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        เกิดข้อผิดพลาด: {error.message}
      </p>
    );
  }

  if (items.length === 0) {
    return <p className="text-zinc-500">ยังไม่มีรายการ</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3 font-semibold">ชื่อ</th>
            <th className="px-4 py-3 font-semibold">รายละเอียด</th>
            <th className="px-4 py-3 font-semibold">วันที่สร้าง</th>
            <th className="px-4 py-3">
              <span className="sr-only">จัดการ</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {item.description ?? "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                {new Date(item.created_at).toLocaleString("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Bangkok",
                })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-start justify-end gap-2">
                  <Link
                    href={`/items/${item.id}/edit`}
                    className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    แก้ไข
                  </Link>
                  <DeleteButton id={item.id} name={item.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
