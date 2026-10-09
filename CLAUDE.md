@AGENTS.md

# CRUD App Demo

แบบฝึกหัดระบบ CRUD สำหรับนักศึกษาปริญญาตรี

## Stack

- Next.js 16.4.0 (App Router, TypeScript, Tailwind CSS) โค้ดอยู่ใน `src/`
- Supabase ผ่าน `@supabase/supabase-js` และ `@supabase/ssr`
- env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## ฐานข้อมูล

ตาราง `items`:

| คอลัมน์ | ชนิด | หมายเหตุ |
| --- | --- | --- |
| `id` | `bigint` | identity, primary key |
| `name` | `text` | not null |
| `description` | `text` | nullable |
| `created_at` | `timestamptz` | default `now()` |

เปิด RLS แล้ว มี policy ให้ `anon` ทำ select/insert/update/delete ได้

## โครงสร้างไฟล์สำคัญ

- `src/lib/supabase/server.ts` — Supabase client ฝั่ง server (Server Component, Server Action, Route Handler)
- `src/lib/supabase/client.ts` — Supabase client ฝั่ง browser (Client Component)
- `src/types/item.ts` — type `Item`

## กติกา

- ทำทีละขั้น ทำเฉพาะขั้นที่ได้รับมอบหมาย ห้ามทำขั้นถัดไปล่วงหน้า
- อธิบายเป็นภาษาไทย
- ห้ามใช้ secret key หรือ `service_role` key ใช้ได้เฉพาะ publishable key
- ห้ามอ่านไฟล์ `.env*` (ผู้ใช้ใส่ค่าเอง)
- ถามก่อนติดตั้ง package ใหม่ทุกครั้ง
