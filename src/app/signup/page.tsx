import Link from "next/link";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto w-full max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">สมัครสมาชิก</h1>
      <SignupForm />
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </main>
  );
}
