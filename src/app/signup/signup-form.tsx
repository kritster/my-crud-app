"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "../auth/actions";

// Client Component เพราะต้องใช้ useActionState เพื่อรับข้อความ error จาก Server Action
export default function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-medium">Username</span>
        <input
          name="username"
          required
          minLength={3}
          maxLength={30}
          autoComplete="username"
          defaultValue={state.values?.username}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium">อีเมล</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium">รหัสผ่าน</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <span className="text-xs text-zinc-500">อย่างน้อย 6 ตัวอักษร</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </button>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
