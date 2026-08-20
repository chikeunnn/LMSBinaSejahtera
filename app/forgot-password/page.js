'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import HeaderLogos from '@/components/ui/HeaderLogos';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email wajib diisi.'); return; }
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) { setError('Gagal mengirim email. Pastikan email terdaftar.'); return; }
      setSent(true);
    } catch { setError('Terjadi kesalahan. Silakan coba lagi.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <HeaderLogos size={36} />
          <div className="auth-logo-icon"><BookOpen size={28} color="#fff" /></div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>LMS Bina Sejahtera</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Email Terkirim!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Link reset password telah dikirim ke <strong>{email}</strong>. Periksa kotak masuk Anda.
            </p>
            <Link href="/login"><button className="btn btn-primary btn-full">Kembali ke Login</button></Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Lupa Password?</h1>
            <p className="auth-subtitle">Masukkan email Anda untuk mendapatkan link reset password</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input id="email" type="email" className="form-input input-with-icon"
                    placeholder="nama@sekolah.sch.id" value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    disabled={loading} />
                </div>
                {error && <span className="form-error">{error}</span>}
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
              <Link href="/login">
                <button type="button" className="btn btn-ghost btn-full" style={{ gap: 6 }}>
                  <ArrowLeft size={16} /> Kembali ke Login
                </button>
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
