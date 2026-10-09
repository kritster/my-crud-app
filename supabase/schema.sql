-- =====================================================================
-- CRUD App Demo: โครงสร้างฐานข้อมูลทั้งหมด (Supabase / PostgreSQL)
--
-- วิธีใช้: คัดลอกทั้งไฟล์ไปวางใน Supabase → SQL Editor → Run
-- รันซ้ำได้ทุกเมื่อโดยไม่ error และไม่ลบข้อมูลเดิม
-- แก้โครงสร้างตารางหรือ RLS เมื่อไหร่ ให้แก้ไฟล์นี้ด้วย แล้วอัปเดต CLAUDE.md
--
-- ตั้งค่าที่ทำใน Dashboard (ไม่ใช่ SQL):
--   Authentication → Sign In / Providers → Email → ปิด "Confirm email"
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) ตาราง items
-- ---------------------------------------------------------------------
create table if not exists public.items (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 100),
  description text,
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete cascade default auth.uid()
);

-- กรณีตารางสร้างไว้ก่อนมีระบบสมาชิก: เพิ่มคอลัมน์เจ้าของ
alter table public.items
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.items
  alter column user_id set default auth.uid();

create index if not exists items_user_id_idx on public.items (user_id);


-- ---------------------------------------------------------------------
-- 2) RLS ของ items: เห็น/แก้/ลบได้เฉพาะแถวของตัวเอง
-- ---------------------------------------------------------------------
alter table public.items enable row level security;

-- policy ชุดแรก (ช่วงฝึก CRUD ก่อนมี login) ที่ให้ทุกคนทำได้
drop policy if exists "items_select" on public.items;
drop policy if exists "items_insert" on public.items;
drop policy if exists "items_update" on public.items;
drop policy if exists "items_delete" on public.items;

drop policy if exists "own_select" on public.items;
drop policy if exists "own_insert" on public.items;
drop policy if exists "own_update" on public.items;
drop policy if exists "own_delete" on public.items;

create policy "own_select" on public.items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own_insert" on public.items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own_update" on public.items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own_delete" on public.items for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.items to authenticated;
revoke select, insert, update, delete on public.items from anon;


-- ---------------------------------------------------------------------
-- 3) ตาราง profiles: ข้อมูลเพิ่มเติมของสมาชิก (email/รหัสผ่านอยู่ใน auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique check (char_length(username) between 3 and 30),
  email      text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

grant select, update on public.profiles to authenticated;
revoke all on public.profiles from anon;


-- ---------------------------------------------------------------------
-- 4) trigger: มีคนสมัคร → สร้างแถวใน profiles อัตโนมัติ
--    username มาจาก options.data.username ตอนเรียก supabase.auth.signUp
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, email)
  values (new.id, new.raw_user_meta_data ->> 'username', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---------------------------------------------------------------------
-- 5) (ไม่บังคับ) ข้อมูลที่สร้างก่อนมีระบบสมาชิกจะมี user_id = null และไม่มีใครเห็น
--    เลือกเปิดใช้บรรทัดใดบรรทัดหนึ่ง (ลบ -- ข้างหน้า) แล้วรันเฉพาะบรรทัดนั้น
-- ---------------------------------------------------------------------
-- update public.items set user_id = 'วาง-User-UID-จาก-Authentication-Users' where user_id is null;
-- delete from public.items where user_id is null;
