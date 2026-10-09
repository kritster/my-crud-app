import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import type { ItemWithOwner } from "@/types/item";
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

// แสดง username ของคนที่ login อยู่ เมนู admin (ถ้าเป็น admin) และปุ่มออกจากระบบ
// (proxy redirect คนที่ยังไม่ login ไป /login ก่อนแล้ว จึงมาถึงตรงนี้เฉพาะคนที่ login)
async function CurrentUser() {
  const profile = await getCurrentProfile();

  return (
    <>
      <span className="text-zinc-600 dark:text-zinc-400">
        สวัสดี{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {profile?.username ?? profile?.email ?? "ผู้ใช้"}
        </span>
      </span>
      {profile?.role === "admin" && (
        <Link
          href="/admin/users"
          className="rounded border border-amber-400 px-3 py-1 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-950"
        >
          จัดการผู้ใช้
        </Link>
      )}
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

  // ดึง profile (เพื่อรู้ว่าเป็น admin ไหม) กับ items พร้อมกัน ไม่ต้องรอทีละอย่าง
  // owner:profiles(...) = join ตาราง profiles ผ่าน FK user_id แล้วตั้งชื่อว่า owner
  // เทียบเท่า SQL: SELECT items.*, profiles.username, profiles.email
  //               FROM items LEFT JOIN profiles ON profiles.id = items.user_id
  //               ORDER BY created_at DESC;
  const [profile, { data, error }] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("items")
      .select("*, owner:profiles(username, email)")
      .order("created_at", { ascending: false }),
  ]);

  const items = (data ?? []) as ItemWithOwner[];
  // admin เห็น items ของทุกคน จึงต้องมีคอลัมน์บอกเจ้าของ (user ทั่วไปเห็นแต่ของตัวเอง)
  const showOwner = profile?.role === "admin";

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
            {showOwner && <th className="px-4 py-3 font-semibold">เจ้าของ</th>}
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
              {showOwner && (
                <td className="px-4 py-3">
                  {item.owner ? (
                    <>
                      <span className="font-medium">
                        {item.owner.username ?? "-"}
                      </span>
                      {item.user_id === profile?.id && (
                        <span className="ml-1 text-xs text-zinc-500">(คุณ)</span>
                      )}
                      <span className="block text-xs text-zinc-500">
                        {item.owner.email}
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-500">ไม่มีเจ้าของ</span>
                  )}
                </td>
              )}
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
