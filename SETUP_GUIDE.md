# LMS Bina Sejahtera — Panduan Setup Lengkap

## ✅ Langkah 1 — Install Dependencies

Buka terminal di folder `d:\LMSBinaSejahtera` lalu jalankan:

```bash
npm install
```

---

## ✅ Langkah 2 — Buat Project Supabase

1. Buka [https://app.supabase.com](https://app.supabase.com)
2. Klik **New Project**
3. Isi nama project: `lms-bina-sejahtera`
4. Pilih region terdekat (misalnya Singapore)
5. Buat password database (simpan dengan aman)
6. Klik **Create Project** dan tunggu ±2 menit

---

## ✅ Langkah 3 — Jalankan SQL Schema

1. Di Supabase dashboard, buka menu **SQL Editor**
2. Klik **New Query**
3. Copy-paste seluruh isi file: `supabase/schema.sql`
4. Klik **Run** (▶)
5. Tunggu hingga semua tabel berhasil dibuat

---

## ✅ Langkah 4 — Isi Environment Variables

1. Di Supabase, buka **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

3. Edit file `.env.local` di folder project:

```
NEXT_PUBLIC_SUPABASE_URL=nimqptwgvatvlvhvugdf
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_k71H6yIbevjPfxvChFw9hw_EflgUJGn 
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LMS Bina Sejahtera
```

> ⚠️ JANGAN commit `.env.local` ke Git!

---

## ✅ Langkah 5 — Buat Akun Demo di Supabase

1. Di Supabase, buka **Authentication → Users**
2. Klik **Invite User** atau **Add User** untuk membuat:

### Siswa Demo:
- Email: `andi@demo.com`
- Password: `demo1234`

### Guru Demo:
- Email: `budi@demo.com`
- Password: `demo1234`

### Admin Demo:
- Email: `admin@demo.com`
- Password: `demo1234`

3. Setelah user dibuat, profil otomatis terbuat via trigger
4. Update profile di Supabase **Table Editor → profiles**:

```sql
-- Update role guru
UPDATE profiles SET role = 'teacher', full_name = 'Budi Santoso' 
WHERE email = 'budi@demo.com';

-- Update role admin
UPDATE profiles SET role = 'admin', full_name = 'Admin Sekolah' 
WHERE email = 'admin@demo.com';

-- Update role student + class
UPDATE profiles 
SET role = 'student', full_name = 'Andi Pratama', 
    class_id = (SELECT id FROM classes WHERE name = 'Kelas 8A' LIMIT 1)
WHERE email = 'andi@demo.com';
```

---

## ✅ Langkah 6 — Buat Supabase Storage Buckets

1. Di Supabase, buka **Storage**
2. Klik **Create Bucket** dan buat 5 bucket berikut:

| Nama Bucket | Public | Keterangan |
|---|---|---|
| `avatars` | ✅ Public | Foto profil |
| `materials` | ❌ Private | File materi |
| `videos` | ❌ Private | Video pembelajaran |
| `assignments` | ❌ Private | Lampiran tugas |
| `thumbnails` | ✅ Public | Thumbnail/cover |

---

## ✅ Langkah 7 — Jalankan Aplikasi

```bash
npm run dev
```

Buka browser: [http://localhost:3000](http://localhost:3000)

---

## ✅ Langkah 8 — Test Login

1. Buka `/login`
2. Login dengan akun demo yang sudah dibuat
3. Verifikasi redirect ke dashboard sesuai role:
   - Siswa → `/student/dashboard`
   - Guru → `/teacher/dashboard`
   - Admin → `/admin/dashboard`

---

## 🔧 Struktur File yang Sudah Dibuat (Phase 1)

```
d:\LMSBinaSejahtera\
├── app/
│   ├── layout.js              ← Root layout
│   ├── globals.css            ← Design system CSS
│   ├── page.js                ← Landing page
│   ├── login/page.js          ← Login page
│   ├── forgot-password/page.js
│   ├── student/
│   │   ├── dashboard/page.js  ← Student dashboard
│   │   ├── subjects/page.js   ← Daftar pelajaran
│   │   └── progress/page.js   ← Progress belajar
│   ├── teacher/
│   │   └── dashboard/page.js  ← Teacher dashboard
│   └── admin/
│       └── dashboard/page.js  ← Admin dashboard
├── components/
│   ├── ui/
│   │   ├── Toast.jsx
│   │   ├── Modal.jsx
│   │   ├── Progress.jsx
│   │   ├── Avatar.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Tabs.jsx
│   │   └── SearchInput.jsx
│   └── layout/
│       ├── DashboardLayout.jsx
│       ├── Sidebar.jsx
│       ├── Topbar.jsx
│       └── MobileNavigation.jsx
├── hooks/
│   ├── useProfile.js
│   └── useNotifications.js
├── lib/
│   ├── supabase/client.js     ← Browser Supabase client
│   ├── supabase/server.js     ← Server Supabase client
│   └── utils/index.js
├── supabase/
│   └── schema.sql             ← Database schema + RLS
├── middleware.js              ← Auth + role guard
├── next.config.js
├── package.json
└── .env.local                 ← ISI DENGAN CREDENTIALS ANDA
```

---

## 🚀 Deploy ke Vercel

1. Push code ke GitHub repository
2. Buka [vercel.com](https://vercel.com) → Import Project
3. Pilih repository
4. Tambahkan Environment Variables (sama seperti `.env.local`)
5. Deploy!

---

## 📋 Status Implementasi Phase (Selesai All 1-6)

- [x] **Phase 1**: Architecture & UI Setup, Supabase Client & RLS, Auth & Layouts
- [x] **Phase 2**: Subject Detail, Material Viewer (PDF/Text/Download), Video Player (YouTube & HTML5, Video Progress)
- [x] **Phase 3**: Interactive Quiz System (Timer Countdown, Auto Grading, Results), Assignment Submissions & Feedback
- [x] **Phase 4**: Teacher Management (CRUD Subjects, Materials, Quizzes & Questions, Assignment Grading & Feedback)
- [x] **Phase 5**: Admin Management (Users Management, Class Management, System Settings)
- [x] **Phase 6**: Security Hardening, Mobile-First Design Polish, Custom Vector Art & Error Diagnostics

