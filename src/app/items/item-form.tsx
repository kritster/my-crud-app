"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "./actions";

type Props = {
  // Server Action ที่จะเรียกเมื่อกดบันทึก (createItem หรือ updateItem ที่ bind id แล้ว)
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  // ค่าเริ่มต้นของฟอร์ม (หน้าแก้ไขส่งข้อมูลเดิมมา, หน้าเพิ่มไม่ต้องส่ง)
  defaultValues?: { name: string; description: string };
};

// Client Component เพราะต้องใช้ useActionState เพื่อรับข้อความ error จาก Server Action
export default function ItemForm({ action, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    { values: defaultValues }
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-medium">
          ชื่อ <span className="text-red-600">*</span>
        </span>
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={state.values?.name}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium">รายละเอียด</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={state.values?.description}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <Link
          href="/"
          className="rounded border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ยกเลิก
        </Link>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
