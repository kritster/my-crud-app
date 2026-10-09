"use client";

import { useState, useTransition } from "react";
import { deleteUser } from "./actions";

type Props = {
  id: string;
  name: string;
};

// Client Component เพราะต้องใช้ confirm() ของ browser, onClick และ state ของปุ่ม
export default function DeleteUserButton({ id, name }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function handleClick() {
    if (
      !confirm(`ต้องการลบผู้ใช้ "${name}" ใช่หรือไม่?\nรายการทั้งหมดของผู้ใช้นี้จะถูกลบด้วย`)
    )
      return;

    setError(undefined);
    // startTransition ทำให้ได้ค่า pending ระหว่างรอ Server Action
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "กำลังลบ..." : "ลบ"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}
