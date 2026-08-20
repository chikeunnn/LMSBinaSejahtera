-- ============================================================
-- FIX: Trigger handle_new_user dengan error handling
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Drop trigger & function lama dulu
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Buat ulang function dengan EXCEPTION handler
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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'student'
    ),
    -- username dari bagian email sebelum @, tambah random suffix agar unique
    split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 6)
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Jangan block pembuatan user meski insert profile gagal
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger kembali
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Verifikasi: cek apakah tabel profiles sudah ada
-- ============================================================
SELECT COUNT(*) as total_profiles FROM public.profiles;
