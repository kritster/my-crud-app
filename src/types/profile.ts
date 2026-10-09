// โครงสร้างข้อมูลของตาราง profiles ใน Supabase
export type Profile = {
  id: string;
  username: string | null;
  email: string | null;
  role: "user" | "admin";
  created_at: string;
};
