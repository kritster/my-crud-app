// โครงสร้างข้อมูลของตาราง items ใน Supabase
export type Item = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};
