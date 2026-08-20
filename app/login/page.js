'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, BookOpen, GraduationCap, ShieldCheck, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoginIllustration } from '@/components/ui/Illustrations';
import HeaderLogos from '@/components/ui/HeaderLogos';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleQuickLogin = (email, password) => {
    setForm({ email, password });
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPassword = form.password;

    if (!cleanEmail || !cleanPassword) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Dedicated Master Super Admin Check
      const isMasterAdmin = (
        (cleanEmail === 'admin@binasejahtera.sch.id' || cleanEmail === 'admin@lms.com' || cleanEmail === 'admin') &&
        (cleanPassword === 'admin123' || cleanPassword === 'admin' || cleanPassword === 'admin2026')
      );

      if (isMasterAdmin) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('lms_admin_login', 'true');
          document.cookie = 'lms_admin_session=true; path=/; max-age=86400; SameSite=Lax';
        }
        router.push('/admin/dashboard');
        router.refresh();
        return;
      }

      // 2. Normal Supabase Auth Sign In
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email atau password tidak cocok. Silakan periksa kembali email & password Anda.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Email belum dikonfirmasi. Periksa kotak masuk email Anda.');
        } else {
          setError('Gagal masuk: ' + authError.message);
        }
        return;
      }

      // 3. Check role in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      const userRole = profile?.role || authData.user.user_metadata?.role || (cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('guru') ? 'teacher' : 'student');
      const routes = { student: '/student/dashboard', teacher: '/teacher/dashboard', admin: '/admin/dashboard' };

      if ((userRole === 'admin' || cleanEmail.includes('admin')) && typeof window !== 'undefined') {
        localStorage.setItem('lms_admin_login', 'true');
        document.cookie = 'lms_admin_session=true; path=/; max-age=86400; SameSite=Lax';
      }

      router.push(routes[userRole] || '/student/dashboard');
      router.refresh();

    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

      {/* Left panel — illustration */}
      <div style={{
        flex: '0 0 480px', background: 'linear-gradient(160deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', overflow: 'hidden',
      }} className="login-left-panel">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 360, height: 360, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30, zIndex: 1 }}>
          <HeaderLogos size={48} />
          <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <BookOpen size={26} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>LMS Bina Sejahtera</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Learning Management System</div>
          </div>
        </div>

        {/* Illustration */}
        <div style={{ zIndex: 1, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' }}>
          <LoginIllustration width={280} height={320} />
        </div>

        {/* Tagline */}
        <div style={{ zIndex: 1, textAlign: 'center', marginTop: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8, lineHeight: 1.3 }}>
            Belajar Kapan Saja,<br />Di Mana Saja
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: 320 }}>
            Akses materi, video pembelajaran, kuis interaktif, dan tugas sekolah dengan mudah.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }} className="mobile-logo-show">
            <HeaderLogos size={40} />
            <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>LMS Bina Sejahtera</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Learning Management System</div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Selamat Datang</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Masuk ke akun LMS Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email / Username</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  className={`form-input input-with-icon ${error ? 'error' : ''}`}
                  placeholder="nama@email.com atau admin"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">Password</label>
                <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                  Lupa password?
                </Link>
              </div>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`form-input input-with-icon ${error ? 'error' : ''}`}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: 'var(--error-light)', borderRadius: 'var(--radius-md)', border: '1px solid #FECACA' }}>
                <AlertCircle size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: 'var(--error)' }}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4, fontSize: 15 }}>
              {loading ? (
                <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Memproses...</>
              ) : (
                <><GraduationCap size={18} /> Masuk ke LMS</>
              )}
            </button>

            {/* Register Link */}
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
              Belum punya akun?{' '}
              <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'underline' }}>
                Daftar Akun Baru
              </Link>
            </div>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            © 2026 LMS Bina Sejahtera. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
