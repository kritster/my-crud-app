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
  created_at timestamptz not null default now(),
  role       text not null default 'user' check (role in ('user', 'admin'))
);

-- กรณีตารางสร้างไว้ก่อนมีระบบ admin: เพิ่มคอลัมน์ role
alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- แก้ได้เฉพาะคอลัมน์ username เท่านั้น ห้ามแก้ role เอง (ไม่งั้นใครก็ตั้งตัวเองเป็น admin ได้)
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username) on public.profiles to authenticated;


-- ---------------------------------------------------------------------
-- 4) trigger: มีคนสมัคร → สร้างแถวใน profiles อัตโนมัติ
--    username มาจาก options.data.username ตอนเรียก supabase.auth.signUp
--    ถ้าสมัครด้วยอีเมล admin (krit@uru.ac.th) จะได้ role = 'admin' ทันที
--    (เปลี่ยนอีเมล admin ต้องแก้ 2 ที่: ในฟังก์ชันนี้ และคำสั่ง update ในส่วนที่ 5)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, email, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.email,
    case when lower(new.email) = 'krit@uru.ac.th' then 'admin' else 'user' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---------------------------------------------------------------------
-- 5) Admin: เห็นรายชื่อ user ทั้งหมด, ลบ user ได้, จัดการ items ได้ทุกแถว
--    admin คือ krit@uru.ac.th
--    - ยังไม่เคยสมัคร → สมัครที่ /signup แล้วเป็น admin ทันที (trigger ในส่วนที่ 4)
--    - สมัครไว้แล้ว   → คำสั่ง update ท้ายส่วนนี้ตั้งให้
-- ---------------------------------------------------------------------

-- ให้ items เชื่อมกับ profiles ได้ เพื่อดึงชื่อเจ้าของมาพร้อมกันในคำสั่งเดียว
-- (โค้ดเรียกแบบนี้: .select("*, owner:profiles(username, email)"))
-- user_id เดิมชี้ไป auth.users ซึ่งดึงผ่าน API ไม่ได้ จึงเพิ่ม FK ชี้ไป profiles อีกตัว

-- สร้าง profile ให้ user ที่สมัครก่อนมี trigger (ไม่งั้นเพิ่ม FK ไม่ผ่าน)
insert into public.profiles (id, username, email)
select id, raw_user_meta_data ->> 'username', email from auth.users
on conflict do nothing;

alter table public.items drop constraint if exists items_user_id_profiles_fkey;
alter table public.items
  add constraint items_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- เช็กว่าคนที่เรียกเป็น admin หรือไม่ ใช้ใน policy และฟังก์ชันอื่น
-- security definer = ทำงานด้วยสิทธิ์เจ้าของฟังก์ชัน จึงอ่าน profiles ได้โดยไม่ติด RLS
-- (ถ้าไม่ใช้ policy ของ profiles ที่เรียกฟังก์ชันนี้จะวนเรียกตัวเองไม่จบ)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- admin อ่าน profiles ได้ทุกแถว (policy หลายตัวรวมกันแบบ OR กับ profiles_select_own)
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles for select to authenticated
  using ((select public.is_admin()));

-- admin เห็น/แก้/ลบ items ได้ทุกแถว (การเพิ่มยังเป็นของตัวเองตาม own_insert)
drop policy if exists "admin_select" on public.items;
drop policy if exists "admin_update" on public.items;
drop policy if exists "admin_delete" on public.items;

create policy "admin_select" on public.items for select to authenticated
  using ((select public.is_admin()));
create policy "admin_update" on public.items for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin_delete" on public.items for delete to authenticated
  using ((select public.is_admin()));

-- ลบ user (ไม่ต้องใช้ service_role key) เรียกจากแอปด้วย supabase.rpc("admin_delete_user", { target })
-- ลบจาก auth.users แล้ว profiles และ items ของ user นั้นถูกลบตาม (on delete cascade)
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if target = auth.uid() then
    raise exception 'cannot_delete_self';
  end if;

  delete from auth.users where id = target;
  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ตั้ง krit@uru.ac.th เป็น admin (กรณีสมัครไว้ก่อนแล้ว ถ้ายังไม่สมัครคำสั่งนี้ไม่มีผลอะไร)
update public.profiles set role = 'admin' where lower(email) = 'krit@uru.ac.th';


-- ---------------------------------------------------------------------
-- 6) (ไม่บังคับ) ข้อมูลที่สร้างก่อนมีระบบสมาชิกจะมี user_id = null และไม่มีใครเห็น
--    เลือกเปิดใช้บรรทัดใดบรรทัดหนึ่ง (ลบ -- ข้างหน้า) แล้วรันเฉพาะบรรทัดนั้น
-- ---------------------------------------------------------------------
-- update public.items set user_id = 'วาง-User-UID-จาก-Authentication-Users' where user_id is null;
-- delete from public.items where user_id is null;
