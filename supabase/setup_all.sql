-- ============================================================
-- SETUP DATABASE UTAMA — LMS BINA SEJAHTERA (MASTER FULL SCHEMA)
-- Salin dan jalankan seluruh query ini di Supabase SQL Editor
-- (Dashboard Supabase -> SQL Editor -> New Query -> Run)
-- ============================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Buat & Migrasi Tabel Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade INTEGER,
  academic_year TEXT DEFAULT '2026/2027',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom academic_year ada jika tabel classes sudah pernah dibuat sebelumnya
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026/2027';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS grade INTEGER;

-- 3. Buat & Migrasi Tabel Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  class_id UUID REFERENCES public.classes(id),
  nis TEXT,
  nip TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nis TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. Buat & Migrasi Tabel Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Buat & Migrasi Tabel Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT DEFAULT 'document',
  content TEXT,
  file_url TEXT,
  allow_download BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'document';

-- 6. Buat Tabel Videos
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration TEXT DEFAULT '10 Menit',
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Buat Tabel Quizzes & Questions
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 70,
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice';

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  is_passed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'completed',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- 8. Buat Tabel Assignments & Submissions
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  max_score INTEGER DEFAULT 100,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  content TEXT,
  score INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Buat Tabel Announcements & Activity Logs
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT DEFAULT 'all',
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Inisialisasi Kelas Sekolah (Kelas 7A-7C, 8A-8C, 9A-9C)
INSERT INTO public.classes (name, grade, code, academic_year, description) VALUES
  ('Kelas 7A', 7, 'K7A-2026', '2026/2027', 'Kelas 7A Semester Genap'),
  ('Kelas 7B', 7, 'K7B-2026', '2026/2027', 'Kelas 7B Semester Genap'),
  ('Kelas 7C', 7, 'K7C-2026', '2026/2027', 'Kelas 7C Semester Genap'),
  ('Kelas 8A', 8, 'K8A-2026', '2026/2027', 'Kelas 8A Semester Genap'),
  ('Kelas 8B', 8, 'K8B-2026', '2026/2027', 'Kelas 8B Semester Genap'),
  ('Kelas 8C', 8, 'K8C-2026', '2026/2027', 'Kelas 8C Semester Genap'),
  ('Kelas 9A', 9, 'K9A-2026', '2026/2027', 'Kelas 9A Semester Genap'),
  ('Kelas 9B', 9, 'K9B-2026', '2026/2027', 'Kelas 9B Semester Genap'),
  ('Kelas 9C', 9, 'K9C-2026', '2026/2027', 'Kelas 9C Semester Genap')
ON CONFLICT DO NOTHING;

-- 11. Trigger Pembuatan Profile Otomatis
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    auth_user_id,
    email,
    full_name,
    role,
    username
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 6)
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Trigger handle_new_user warning: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 12. Kebijakan RLS (Semua Tabel Diizinkan Untuk User Terautentikasi / Publik Read)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all classes" ON public.classes;
DROP POLICY IF EXISTS "Allow all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow all materials" ON public.materials;
DROP POLICY IF EXISTS "Allow all videos" ON public.videos;
DROP POLICY IF EXISTS "Allow all quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Allow all questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Allow all options" ON public.quiz_options;
DROP POLICY IF EXISTS "Allow all attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Allow all submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Allow all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow all logs" ON public.activity_logs;

CREATE POLICY "Allow all profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all videos" ON public.videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all quizzes" ON public.quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all questions" ON public.quiz_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all options" ON public.quiz_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all attempts" ON public.quiz_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all submissions" ON public.assignment_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- Done! Master schema setup ready for LMS Bina Sejahtera.
