-- ============================================================
-- LMS BINA SEJAHTERA — DATABASE SCHEMA
-- Jalankan di Supabase SQL Editor (app.supabase.com)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PROFILES (extends Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  class_id UUID REFERENCES classes(id),
  nis TEXT,
  nip TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  teacher_id UUID REFERENCES profiles(id),
  class_id UUID REFERENCES classes(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CHAPTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. MATERIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'pdf', 'video', 'image', 'document', 'link', 'ppt', 'excel')),
  content TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  allow_download BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. VIDEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id),
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 70,
  randomize_questions BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. QUIZ QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')),
  points INTEGER DEFAULT 10,
  order_number INTEGER DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. QUIZ OPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER,
  total_points INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- ============================================================
-- 11. QUIZ ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id),
  selected_option_id UUID REFERENCES quiz_options(id),
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id),
  title TEXT NOT NULL,
  description TEXT,
  attachment_url TEXT,
  deadline TIMESTAMPTZ,
  max_score INTEGER DEFAULT 100,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. ASSIGNMENT SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- 14. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  teacher_id UUID REFERENCES profiles(id),
  subject_id UUID REFERENCES subjects(id),
  class_id UUID REFERENCES classes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'assignment', 'quiz', 'material', 'announcement', 'grade', 'deadline')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. STUDENT PROGRESS (per subject)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  completed_materials INTEGER DEFAULT 0,
  total_materials INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- ============================================================
-- 17. MATERIAL PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS material_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, material_id)
);

-- ============================================================
-- 18. VIDEO PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, video_id)
);

-- ============================================================
-- 19. FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  message TEXT,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_chapter_id ON materials(chapter_id);
CREATE INDEX IF NOT EXISTS idx_videos_subject_id ON videos(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_material_progress_student_id ON material_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_student_id ON video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's profile id
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: get current user's class_id
CREATE OR REPLACE FUNCTION get_my_class_id()
RETURNS UUID AS $$
  SELECT class_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth_user_id = auth.uid());
CREATE POLICY "Teachers can view students in their class" ON profiles FOR SELECT USING (
  get_my_role() = 'teacher' AND role = 'student'
);
CREATE POLICY "Admin full access profiles" ON profiles USING (get_my_role() = 'admin');

-- ============================================================
-- CLASSES POLICIES
-- ============================================================
CREATE POLICY "All authenticated can view classes" ON classes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can manage classes" ON classes USING (get_my_role() = 'admin');

-- ============================================================
-- SUBJECTS POLICIES
-- ============================================================
CREATE POLICY "Students can view subjects of their class" ON subjects FOR SELECT USING (
  get_my_role() = 'student' AND class_id = get_my_class_id()
);
CREATE POLICY "Teachers can manage own subjects" ON subjects USING (
  get_my_role() = 'teacher' AND teacher_id = get_my_profile_id()
);
CREATE POLICY "Teachers can view all subjects" ON subjects FOR SELECT USING (get_my_role() = 'teacher');
CREATE POLICY "Admin full access subjects" ON subjects USING (get_my_role() = 'admin');

-- ============================================================
-- CHAPTERS, MATERIALS, VIDEOS POLICIES
-- ============================================================
CREATE POLICY "Authenticated can view chapters" ON chapters FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teacher/admin can manage chapters" ON chapters USING (get_my_role() IN ('teacher', 'admin'));

CREATE POLICY "Students can view published materials" ON materials FOR SELECT USING (
  get_my_role() = 'student' AND is_published = TRUE
);
CREATE POLICY "Teachers manage own materials" ON materials USING (
  get_my_role() = 'teacher' AND created_by = get_my_profile_id()
);
CREATE POLICY "Admin full access materials" ON materials USING (get_my_role() = 'admin');

CREATE POLICY "Students can view published videos" ON videos FOR SELECT USING (
  get_my_role() = 'student' AND is_published = TRUE
);
CREATE POLICY "Teachers manage own videos" ON videos USING (
  get_my_role() = 'teacher' AND created_by = get_my_profile_id()
);
CREATE POLICY "Admin full access videos" ON videos USING (get_my_role() = 'admin');

-- ============================================================
-- QUIZ POLICIES
-- ============================================================
CREATE POLICY "Students view published quizzes" ON quizzes FOR SELECT USING (
  get_my_role() = 'student' AND is_published = TRUE
);
CREATE POLICY "Teachers manage own quizzes" ON quizzes USING (
  get_my_role() = 'teacher' AND created_by = get_my_profile_id()
);
CREATE POLICY "Admin full access quizzes" ON quizzes USING (get_my_role() = 'admin');

CREATE POLICY "Authenticated view quiz questions" ON quiz_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teacher/admin manage quiz questions" ON quiz_questions USING (get_my_role() IN ('teacher', 'admin'));

CREATE POLICY "Authenticated view quiz options" ON quiz_options FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teacher/admin manage quiz options" ON quiz_options USING (get_my_role() IN ('teacher', 'admin'));

CREATE POLICY "Students manage own attempts" ON quiz_attempts USING (student_id = get_my_profile_id());
CREATE POLICY "Teachers view attempts for their quizzes" ON quiz_attempts FOR SELECT USING (get_my_role() = 'teacher');
CREATE POLICY "Admin full access attempts" ON quiz_attempts USING (get_my_role() = 'admin');

CREATE POLICY "Students manage own answers" ON quiz_answers USING (
  attempt_id IN (SELECT id FROM quiz_attempts WHERE student_id = get_my_profile_id())
);
CREATE POLICY "Teacher/admin view all answers" ON quiz_answers FOR SELECT USING (get_my_role() IN ('teacher', 'admin'));

-- ============================================================
-- ASSIGNMENT POLICIES
-- ============================================================
CREATE POLICY "Students view assignments for their class" ON assignments FOR SELECT USING (
  get_my_role() = 'student'
);
CREATE POLICY "Teachers manage own assignments" ON assignments USING (
  get_my_role() = 'teacher' AND created_by = get_my_profile_id()
);
CREATE POLICY "Admin full access assignments" ON assignments USING (get_my_role() = 'admin');

CREATE POLICY "Students manage own submissions" ON assignment_submissions USING (
  student_id = get_my_profile_id()
);
CREATE POLICY "Teachers view submissions for their assignments" ON assignment_submissions FOR SELECT USING (
  get_my_role() = 'teacher'
);
CREATE POLICY "Teachers grade submissions" ON assignment_submissions FOR UPDATE USING (get_my_role() = 'teacher');
CREATE POLICY "Admin full access submissions" ON assignment_submissions USING (get_my_role() = 'admin');

-- ============================================================
-- ANNOUNCEMENTS, NOTIFICATIONS POLICIES
-- ============================================================
CREATE POLICY "Students view relevant announcements" ON announcements FOR SELECT USING (
  get_my_role() = 'student' AND (class_id = get_my_class_id() OR class_id IS NULL)
);
CREATE POLICY "Teachers manage own announcements" ON announcements USING (
  get_my_role() = 'teacher' AND teacher_id = get_my_profile_id()
);
CREATE POLICY "Admin full access announcements" ON announcements USING (get_my_role() = 'admin');

CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (user_id = get_my_profile_id());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = get_my_profile_id());
CREATE POLICY "Admin full access notifications" ON notifications USING (get_my_role() = 'admin');

-- ============================================================
-- PROGRESS POLICIES
-- ============================================================
CREATE POLICY "Students view own progress" ON student_progress USING (student_id = get_my_profile_id());
CREATE POLICY "Teachers view student progress" ON student_progress FOR SELECT USING (get_my_role() = 'teacher');
CREATE POLICY "Admin full access student_progress" ON student_progress USING (get_my_role() = 'admin');

CREATE POLICY "Students manage own material progress" ON material_progress USING (student_id = get_my_profile_id());
CREATE POLICY "Teachers view material progress" ON material_progress FOR SELECT USING (get_my_role() = 'teacher');
CREATE POLICY "Admin full access material_progress" ON material_progress USING (get_my_role() = 'admin');

CREATE POLICY "Students manage own video progress" ON video_progress USING (student_id = get_my_profile_id());
CREATE POLICY "Teachers view video progress" ON video_progress FOR SELECT USING (get_my_role() = 'teacher');
CREATE POLICY "Admin full access video_progress" ON video_progress USING (get_my_role() = 'admin');

-- ============================================================
-- FEEDBACK & LOGS
-- ============================================================
CREATE POLICY "Students manage own feedback" ON feedback USING (student_id = get_my_profile_id());
CREATE POLICY "Admin full access feedback" ON feedback USING (get_my_role() = 'admin');

CREATE POLICY "Admin full access logs" ON activity_logs USING (get_my_role() = 'admin');
CREATE POLICY "Teachers view own logs" ON activity_logs FOR SELECT USING (user_id = get_my_profile_id() AND get_my_role() = 'teacher');

-- ============================================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (auth_user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA (untuk testing)
-- ============================================================

-- Classes
INSERT INTO classes (name, grade, description) VALUES
  ('Kelas 7A', 7, 'Kelas 7A Semester Genap'),
  ('Kelas 7B', 7, 'Kelas 7B Semester Genap'),
  ('Kelas 8A', 8, 'Kelas 8A Semester Genap'),
  ('Kelas 8B', 8, 'Kelas 8B Semester Genap'),
  ('Kelas 9A', 9, 'Kelas 9A Semester Genap')
ON CONFLICT DO NOTHING;

-- NOTE: User accounts harus dibuat melalui Supabase Auth terlebih dahulu
-- Kemudian update class_id pada profile yang dibuat otomatis oleh trigger
