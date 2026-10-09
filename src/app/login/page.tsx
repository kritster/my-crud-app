import Link from "next/link";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">เข้าสู่ระบบ</h1>
      <LoginForm />
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </main>
  );
}
