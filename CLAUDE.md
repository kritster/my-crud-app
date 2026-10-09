@AGENTS.md

# CRUD App Demo

แบบฝึกหัดระบบ CRUD สำหรับนักศึกษาปริญญาตรี

## Stack

- Next.js 16.4.0 (App Router, TypeScript, Tailwind CSS) โค้ดอยู่ใน `src/`
- Supabase ผ่าน `@supabase/supabase-js` และ `@supabase/ssr`
- env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## ฐานข้อมูล

SQL ทั้งหมดอยู่ที่ `supabase/schema.sql` (รันซ้ำได้) ถ้าเปลี่ยนตาราง/RLS ให้แก้ไฟล์นั้นด้วย แล้วให้ผู้ใช้นำไปรันใน Supabase SQL Editor เอง
`supabase/reset.sql` ใช้ล้างข้อมูลทดสอบ ถ้าเพิ่มตารางใหม่ให้เพิ่มลงในคำสั่ง `truncate` ของไฟล์นี้ด้วย

ตาราง `items`:

| คอลัมน์ | ชนิด | หมายเหตุ |
| --- | --- | --- |
| `id` | `bigint` | identity, primary key |
| `name` | `text` | not null |
| `description` | `text` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| `user_id` | `uuid` | FK → `auth.users(id)` และ FK → `profiles(id)` (ทั้งคู่ on delete cascade), default `auth.uid()` |

ดึงชื่อเจ้าของพร้อม item ได้ด้วย `.select("*, owner:profiles(username, email)")` (type `ItemWithOwner`)

RLS: เฉพาะ role `authenticated` และเฉพาะแถวที่ `user_id = auth.uid()` (select/insert/update/delete) ส่วน `anon` ไม่มีสิทธิ์
- admin select/update/delete ได้ทุกแถว (policy `admin_*`) แต่ insert ได้เฉพาะของตัวเอง
- ไม่ต้องส่ง `user_id` ตอน insert และไม่ต้องกรอง `user_id` ในโค้ด ฐานข้อมูลจัดการให้
- update/delete แถวของคนอื่นจะได้ 0 แถว (ไม่ใช่ error) ให้ถือเป็น "ไม่พบรายการ"

ตาราง `profiles`: `id` (uuid, PK, FK → `auth.users`), `username` (unique, 3–30 ตัวอักษร), `email`, `created_at`, `role` (`'user'` | `'admin'`, default `'user'`)
- trigger `on_auth_user_created` สร้างแถวให้อัตโนมัติตอนสมัคร จาก `raw_user_meta_data.username`
- RLS: อ่านได้เฉพาะแถวของตัวเอง (admin อ่านได้ทุกแถว) แก้ได้เฉพาะคอลัมน์ `username` ของตัวเอง ห้ามแก้ `role`
- admin คือ `krit@uru.ac.th`: trigger ตั้ง role ให้ตอนสมัคร และ `schema.sql` มีคำสั่ง update สำหรับบัญชีที่สมัครไว้แล้ว (เปลี่ยนอีเมลต้องแก้ทั้ง 2 ที่) แอปไม่มีหน้าตั้ง role

ฟังก์ชัน SQL (security definer):
- `is_admin()` — คนที่เรียกเป็น admin หรือไม่ ใช้ใน policy
- `admin_delete_user(target uuid)` — ลบ user จาก `auth.users` (cascade ไป profiles/items) เฉพาะ admin และห้ามลบตัวเอง เรียกด้วย `supabase.rpc(...)`

## Auth

- Supabase Auth แบบ email + password ปิด Confirm email ไว้ (สมัครแล้วเข้าใช้ได้ทันที)
- ทุกหน้ายกเว้น `/login` และ `/signup` ต้อง login ก่อน

## โครงสร้างไฟล์สำคัญ

- `src/lib/supabase/server.ts` — Supabase client ฝั่ง server (Server Component, Server Action, Route Handler)
- `src/lib/supabase/client.ts` — Supabase client ฝั่ง browser (Client Component)
- `src/lib/supabase/proxy.ts` + `src/proxy.ts` — refresh session และกันหน้าที่ต้อง login (Next.js 16 ใช้ proxy แทน middleware)
- `src/app/auth/actions.ts` — Server Actions ของ signup / login / logout
- `src/app/items/actions.ts` — Server Actions ของ create / update / delete
- `src/app/admin/users/` — หน้าจัดการผู้ใช้สำหรับ admin (ดูรายชื่อ / ลบ user)
- `src/lib/profile.ts` — `getCurrentProfile()` ดึง profile (username, role) ของคนที่ login อยู่
- `src/types/item.ts` — type `Item`
- `src/types/profile.ts` — type `Profile`

## กติกา

- ทำทีละขั้น ทำเฉพาะขั้นที่ได้รับมอบหมาย ห้ามทำขั้นถัดไปล่วงหน้า
- อธิบายเป็นภาษาไทย
- ห้ามใช้ secret key หรือ `service_role` key ใช้ได้เฉพาะ publishable key
- ห้ามอ่านไฟล์ `.env*` (ผู้ใช้ใส่ค่าเอง)
- ถามก่อนติดตั้ง package ใหม่ทุกครั้ง
