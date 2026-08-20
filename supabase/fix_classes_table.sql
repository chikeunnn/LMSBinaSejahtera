-- ============================================================
-- SCRIPT PERBAIKAN TABEL KELAS (CLASSES) & RLS POLICY
-- Jalankan query ini di Supabase SQL Editor jika masih menemui kendala
-- (Supabase Dashboard -> SQL Editor -> New Query -> Run)
-- ============================================================

-- 1. Tambahkan kolom 'code' dan struktur pendukung jika belum ada
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026/2027';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS grade INTEGER;

-- 2. Pastikan Kebijakan RLS Mengizinkan Guru dan Admin Mengelola Kelas
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all classes" ON public.classes;
DROP POLICY IF EXISTS "All authenticated can view classes" ON public.classes;
DROP POLICY IF EXISTS "Admin can manage classes" ON public.classes;

-- Izinkan semua akses (Read/Insert/Update/Delete) untuk tabel classes
CREATE POLICY "Allow all classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
