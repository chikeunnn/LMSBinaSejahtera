'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, BookOpen, UserPlus, CheckCircle, GraduationCap, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoginIllustration } from '@/components/ui/Illustrations';
import HeaderLogos from '@/components/ui/HeaderLogos';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      setError('Harap isi semua kolom wajib.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const cleanEmail = form.email.trim();
      const cleanName = form.fullName.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          data: {
            full_name: cleanName,
            role: form.role
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          setError('Email ini sudah terdaftar. Silakan masuk menggunakan email Anda di halaman Login.');
        } else if (signUpError.message.toLowerCase().includes('rate limit')) {
          setError('Batas pendaftaran email Supabase tercapai (Email Rate Limit Exceeded). Anda dapat menggunakan akun Demo langsung di halaman Login atau mencoba beberapa saat lagi.');
        } else if (signUpError.message.includes('Database error')) {
          setError('Terjadi kendala konfigurasi database. Pastikan script setup Supabase telah dijalankan.');
        } else {
          setError('Gagal mendaftar: ' + signUpError.message);
        }
        return;
      }

      if (data.session) {
        const routes = { student: '/student/dashboard', teacher: '/teacher/dashboard', admin: '/admin/dashboard' };
        router.push(routes[form.role] || '/student/dashboard');
        router.refresh();
      } else {
        setSuccess(true);
      }

    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', display: 'flex', background: '#FFFFFF', overflow: 'hidden' }}>

      {/* Left panel — illustration */}
      <div style={{
        flex: '0 0 440px', background: 'linear-gradient(160deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 40px', position: 'relative', overflow: 'hidden',
      }} className="login-left-panel">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 360, height: 360, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, zIndex: 1 }}>
          <HeaderLogos size={56} />
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <BookOpen size={24} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>LMS Bina Sejahtera</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Learning Management System</div>
          </div>
        </div>

        {/* Illustration */}
        <div style={{ zIndex: 1, filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.15))' }}>
          <LoginIllustration width={240} height={260} />
        </div>

        <div style={{ zIndex: 1, textAlign: 'center', marginTop: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 }}>
            Bergabung dengan LMS
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, maxWidth: 300 }}>
            Daftarkan diri Anda untuk mengakses materi pembelajaran, kuis, dan tugas sekolah secara digital.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 32px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }} className="mobile-logo-show">
            <HeaderLogos size={48} />
            <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>LMS Bina Sejahtera</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Learning Management System</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Daftar Akun Baru</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Isi data di bawah untuk membuat akun baru</p>
          </div>

          {success ? (
            <div style={{ padding: 20, background: '#D1FAE5', borderRadius: 16, border: '1px solid #A7F3D0', textAlign: 'center' }}>
              <CheckCircle size={40} color="#059669" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>Pendaftaran Berhasil!</h3>
              <p style={{ fontSize: 13, color: '#065F46', lineHeight: 1.5, marginBottom: 16 }}>
                Akun Anda telah berhasil dibuat. Silakan masuk menggunakan email dan password yang baru didaftarkan.
              </p>
              <Link href="/login">
                <button className="btn btn-primary btn-full">Masuk ke Akun Sekarang</button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Role Select */}
              <div className="form-group" style={{ marginBottom: 4 }}>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 6, fontWeight: 700, color: 'var(--text-primary)' }}>Daftar Sebagai</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'student' })}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      border: `1.5px solid ${form.role === 'student' ? 'var(--primary)' : '#CBD5E1'}`,
                      background: form.role === 'student' ? '#EFF6FF' : '#FFFFFF',
                      fontWeight: 700, fontSize: 13, color: form.role === 'student' ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s'
                    }}
                  >
                    <GraduationCap size={16} color={form.role === 'student' ? 'var(--primary)' : '#64748B'} />
                    <span>Siswa / Siswi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'teacher' })}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      border: `1.5px solid ${form.role === 'teacher' ? 'var(--primary)' : '#CBD5E1'}`,
                      background: form.role === 'teacher' ? '#EFF6FF' : '#FFFFFF',
                      fontWeight: 700, fontSize: 13, color: form.role === 'teacher' ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s'
                    }}
                  >
                    <UserCheck size={16} color={form.role === 'teacher' ? 'var(--primary)' : '#64748B'} />
                    <span>Guru / Pengajar</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="fullName" style={{ fontSize: 12, marginBottom: 4 }}>Nama Lengkap</label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="form-input input-with-icon"
                    placeholder="Contoh: Budi Santoso"
                    value={form.fullName}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ padding: '8px 12px 8px 40px', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email" style={{ fontSize: 12, marginBottom: 4 }}>Alamat Email</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="form-input input-with-icon"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ padding: '8px 12px 8px 40px', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password" style={{ fontSize: 12, marginBottom: 4 }}>Password (Minimal 6 karakter)</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input input-with-icon"
                    placeholder="Buat password aman"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ padding: '8px 40px 8px 40px', fontSize: 13 }}
                  />
                  <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword" style={{ fontSize: 12, marginBottom: 4 }}>Konfirmasi Password</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input input-with-icon"
                    placeholder="Ulangi password di atas"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ padding: '8px 12px 8px 40px', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--error-light)', borderRadius: 'var(--radius-md)', border: '1px solid #FECACA' }}>
                  <AlertCircle size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--error)' }}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4, padding: '10px 16px', fontSize: 14, gap: 8 }}>
                {loading ? 'Memproses Pendaftaran...' : <><UserPlus size={16} /> Buat Akun Sekarang</>}
              </button>

              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                Sudah punya akun?{' '}
                <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  Masuk di sini
                </Link>
              </div>
            </form>
          )}

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            © 2026 LMS Bina Sejahtera. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
