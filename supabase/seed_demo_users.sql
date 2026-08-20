-- ==========================================
-- SCRIPT AUTO-CREATE DEMO USERS SUPABASE
-- Jalankan query ini di Supabase SQL Editor
-- ==========================================

-- 1. Pastikan ekstensi pgcrypto aktif untuk hashing password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Fungsi helper untuk membuat user auth & profile sekaligus
CREATE OR REPLACE FUNCTION create_demo_user_if_not_exists(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_role TEXT
) RETURNS VOID AS $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  encrypted_pwd TEXT;
BEGIN
  -- Cek apakah user sudah ada di auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    encrypted_pwd := crypt(user_password, gen_salt('bf'));

    -- Insert ke auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      encrypted_pwd,
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', user_name, 'role', user_role),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );

    -- Insert atau update ke public.profiles
    INSERT INTO public.profiles (
      auth_user_id,
      email,
      full_name,
      role,
      username
    ) VALUES (
      new_user_id,
      user_email,
      user_name,
      user_role,
      split_part(user_email, '@', 1)
    )
    ON CONFLICT (auth_user_id) DO UPDATE 
    SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

    RAISE NOTICE 'User % berhasil dibuat dengan role %', user_email, user_role;
  ELSE
    -- Jika user sudah ada, update profile nya
    UPDATE public.profiles 
    SET role = user_role, full_name = user_name
    WHERE email = user_email;

    RAISE NOTICE 'User % sudah ada, profile diperbarui', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Eksekusi pembuatan 3 Akun Demo Utama
SELECT create_demo_user_if_not_exists('andi@demo.com', 'demo1234', 'Andi Pratama', 'student');
SELECT create_demo_user_if_not_exists('budi@demo.com', 'demo1234', 'Budi Santoso', 'teacher');
SELECT create_demo_user_if_not_exists('admin@demo.com', 'demo1234', 'Administrator LMS', 'admin');
