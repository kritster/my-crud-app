import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import type { Profile } from "@/types/profile";
import DeleteUserButton from "./delete-user-button";

// ทั้งหน้าอยู่ใน <Suspense> เพราะต้องรู้ก่อนว่าเป็น admin หรือไม่
// คนที่ไม่ใช่ admin จะเห็นหน้า 404 แทน ไม่เห็นแม้แต่หัวข้อ
export default function AdminUsersPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Suspense fallback={<p className="text-zinc-500">กำลังโหลด...</p>}>
        <AdminUsers />
      </Suspense>
    </main>
  );
}

async function AdminUsers() {
  const me = await getCurrentProfile();
  // ด่านแรกในหน้าเว็บ ส่วนด่านจริงคือ RLS และฟังก์ชัน admin_delete_user ในฐานข้อมูล
  if (me?.role !== "admin") notFound();

  const supabase = await createClient();
  // admin มี policy profiles_select_admin จึงเห็นทุกแถว
  // เทียบเท่า SQL: SELECT * FROM profiles ORDER BY created_at;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const users = (data ?? []) as Profile[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">จัดการผู้ใช้</h1>
        <Link
          href="/"
          className="rounded border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          กลับหน้ารายการ
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          เกิดข้อผิดพลาด: {error.message}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">อีเมล</th>
                <th className="px-4 py-3 font-semibold">สิทธิ์</th>
                <th className="px-4 py-3 font-semibold">วันที่สมัคร</th>
                <th className="px-4 py-3">
                  <span className="sr-only">จัดการ</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">
                    {user.username ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {user.email ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "admin" ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        admin
                      </span>
                    ) : (
                      <span className="text-zinc-500">user</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                    {new Date(user.created_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Bangkok",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* ลบตัวเองไม่ได้ (ฐานข้อมูลก็กันไว้เช่นกัน) */}
                    {user.id === me.id ? (
                      <span className="text-xs text-zinc-500">(คุณ)</span>
                    ) : (
                      <DeleteUserButton
                        id={user.id}
                        name={user.username ?? user.email ?? user.id}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
