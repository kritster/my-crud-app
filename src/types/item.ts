import type { Profile } from "./profile";

// โครงสร้างข้อมูลของตาราง items ใน Supabase
export type Item = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string | null;
};

// item พร้อมข้อมูลเจ้าของที่ join มาจาก profiles
// owner เป็น null ถ้า item ไม่มีเจ้าของ หรือ RLS ไม่ให้อ่าน profile นั้น
export type ItemWithOwner = Item & {
  owner: Pick<Profile, "username" | "email"> | null;
};
