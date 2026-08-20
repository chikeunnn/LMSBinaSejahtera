'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Video, HelpCircle, TrendingUp, Monitor, CheckCircle, ChevronRight, Smartphone, Tablet, Star, LogOut, User, Clock, Users, BookMarked, PlayCircle, GraduationCap, Sparkles, Layers, Award } from 'lucide-react';
import { HeroIllustration, StudyIllustration } from '@/components/ui/Illustrations';
import HeroSlider from '@/components/ui/HeroSlider';
import HeaderLogos from '@/components/ui/HeaderLogos';
import { createClient } from '@/lib/supabase/client';

const features = [
  { icon: BookOpen, title: 'Materi Digital', desc: 'PDF, dokumen, gambar, dan teks — semua bisa diakses kapan saja.', color: '#2563EB', bg: '#EFF6FF' },
  { icon: Video, title: 'Video Pembelajaran', desc: 'Tonton video penjelasan guru dengan kualitas terbaik.', color: '#0284C7', bg: '#F0F9FF' },
  { icon: HelpCircle, title: 'Kuis Interaktif', desc: 'Uji pemahaman dengan kuis pilihan ganda dan true/false.', color: '#059669', bg: '#ECFDF5' },
  { icon: TrendingUp, title: 'Progress Belajar', desc: 'Pantau perkembangan belajarmu secara real-time dan detail.', color: '#7C3AED', bg: '#F5F3FF' },
  { icon: CheckCircle, title: 'Tugas Online', desc: 'Kumpulkan tugas langsung dari smartphone atau laptop.', color: '#D97706', bg: '#FFFBEB' },
  { icon: Monitor, title: 'Akses Multi-Device', desc: 'Belajar dari HP, tablet, atau PC — responsive di semua layar.', color: '#0F766E', bg: '#CCFBF1' },
];

const stats = [
  { icon: Users, value: '100+', label: 'Siswa Aktif' },
  { icon: BookMarked, value: '10+', label: 'Mata Pelajaran' },
  { icon: PlayCircle, value: '50+', label: 'Video Pembelajaran' },
  { icon: Clock, value: '24/7', label: 'Akses Online' },
];

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('student');

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profile?.role) setUserRole(profile.role);
      }
    }
    checkUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
    window.location.href = '/login';
  };

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          
          {/* Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <HeaderLogos size={36} />
            <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={18} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="brand-title" style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                LMS Bina Sejahtera
              </div>
              <div className="brand-subtext" style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Learning Management System
              </div>
            </div>
          </div>
          
          {/* Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {currentUser ? (
              <>
                <Link href={`/${userRole}/dashboard`}>
                  <button className="btn btn-primary btn-sm" style={{ gap: 4, padding: '6px 12px' }}>
                    <User size={14} /> <span style={{ fontSize: 12 }}>Dashboard</span>
                  </button>
                </Link>
                <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ gap: 4, color: 'var(--error)', borderColor: '#FECACA', padding: '6px 10px' }}>
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button className="btn btn-outline btn-sm" style={{ padding: '6px 14px', fontSize: 12 }}>
                    Masuk
                  </button>
                </Link>
                <Link href="/register">
                  <button className="btn btn-primary btn-sm" style={{ gap: 4, padding: '6px 14px', fontSize: 12 }}>
                    Daftar <ChevronRight size={14} />
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '48px 16px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }} className="landing-grid-responsive">
          
          {/* Text side */}
          <div>
            <div className="badge badge-primary" style={{ marginBottom: 16, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', fontWeight: 700, borderRadius: 9999, background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <GraduationCap size={16} color="var(--primary)" />
              <span>Platform Pembelajaran Digital Sekolah</span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 12 }}>
              Belajar Lebih Mudah dengan <span style={{ color: 'var(--primary)' }}>LMS Bina Sejahtera</span>
            </h1>

            {/* Pemberi Dana Info Card with Left Accent Border */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'var(--text-secondary)',
              background: '#F8FAFC',
              borderLeft: '4px solid var(--primary)',
              borderTop: '1px solid #E2E8F0',
              borderRight: '1px solid #E2E8F0',
              borderBottom: '1px solid #E2E8F0',
              padding: '8px 16px',
              borderRadius: '0 10px 10px 0',
              marginBottom: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <Award size={16} color="var(--primary)" />
              <span>Pemberi Dana: <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>DPPM-Kemdiktisainstek Tahun 2026</strong></span>
            </div>

            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28, maxWidth: 540 }}>
              Platform pembelajaran digital yang sederhana, interaktif, dan dapat diakses kapan saja melalui smartphone, tablet, atau laptop.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              {currentUser ? (
                <Link href={`/${userRole}/dashboard`} style={{ width: '100%', maxWidth: 280 }}>
                  <button className="btn btn-primary btn-lg" style={{ gap: 10, width: '100%', padding: '14px 32px', fontSize: 15 }}>
                    Buka Dashboard <ChevronRight size={18} />
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/register" style={{ flex: '1 1 180px', maxWidth: 260 }}>
                    <button className="btn btn-primary btn-lg" style={{ gap: 8, width: '100%', padding: '14px 22px', fontSize: 15 }}>
                      Daftar Akun Sekarang <ChevronRight size={16} />
                    </button>
                  </Link>
                  <Link href="/login" style={{ flex: '1 1 120px', maxWidth: 160 }}>
                    <button className="btn btn-outline btn-lg" style={{ width: '100%', padding: '14px 22px', fontSize: 15 }}>
                      Masuk
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Device support */}
            <div style={{ display: 'flex', gap: 20, color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
              {[{ icon: Smartphone, label: 'Smartphone' }, { icon: Tablet, label: 'Tablet' }, { icon: Monitor, label: 'Desktop' }].map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <d.icon size={16} color="var(--primary)" /> {d.label}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Slider side (16:9 1920x1080 Photo Slider) */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <HeroSlider />
          </div>

        </div>
      </section>

      {/* Floating Stats Bar Container */}
      <section style={{ maxWidth: 1200, margin: '60px auto 56px', padding: '0 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 12px 32px rgba(37,99,235,0.20)',
          color: '#FFFFFF'
        }}>
          <div className="landing-stats-responsive">
            {stats.map((s, i) => {
              const IconComponent = s.icon;
              return (
                <div key={i} className={i < 3 ? 'stat-item-border' : ''} style={{
                  textAlign: 'center',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <div style={{ opacity: 0.9, marginBottom: 2 }}>
                    <IconComponent size={22} color="#FFFFFF" />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '32px 16px 56px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="badge badge-primary" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, fontWeight: 700, fontSize: 13, background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Sparkles size={14} color="var(--primary)" /> Fitur Unggulan
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Semua yang Kamu Butuhkan
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto' }}>
              Fitur lengkap untuk pengalaman belajar yang menyenangkan, efektif, dan modern.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} className="card card-padding card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid var(--border)', borderRadius: 20 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: f.bg,
                  color: f.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}>
                  <f.icon size={24} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '56px 16px 64px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="landing-how-responsive">
            
            {/* Left side text steps */}
            <div>
              <div className="badge badge-primary" style={{ marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, fontWeight: 700, fontSize: 13, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Layers size={14} color="var(--primary)" /> Cara Kerja
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.2 }}>
                Belajar Lebih Cerdas dengan Teknologi Modern
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { step: '01', title: 'Login & Pilih Pelajaran', desc: 'Masuk dengan akun sekolah dan pilih mata pelajaran yang ingin dipelajari.' },
                  { step: '02', title: 'Akses Materi & Video', desc: 'Buka materi digital, tonton video, dan pelajari modul visual kapan saja.' },
                  { step: '03', title: 'Kerjakan Kuis & Tugas', desc: 'Uji pemahaman dengan kuis interaktif dan kumpulkan tugas secara online.' },
                  { step: '04', title: 'Pantau Progress', desc: 'Lihat perkembangan belajar secara real-time dan raih prestasi terbaikmu.' },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', background: '#FFFFFF', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 15,
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(37,99,235,0.22)'
                    }}>
                      {s.step}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{s.title}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side illustration */}
            <div className="animate-float-delayed" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ filter: 'drop-shadow(0 20px 30px rgba(37,99,235,0.12))', width: '100%', maxWidth: 460 }}>
                <StudyIllustration width="100%" height="auto" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer - Left/Right Split */}
      <footer style={{ background: '#0F172A', color: '#94A3B8', padding: '48px 16px 36px', borderTop: '1px solid #1E293B' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Top Row: Brand Left, Links Right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap', marginBottom: 36 }}>

            {/* Left Side: Brand & Description */}
            <div style={{ maxWidth: 400 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={18} color="white" />
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>LMS Bina Sejahtera</span>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.7 }}>
                Learning Management System sekolah untuk kemudahan proses belajar mengajar interaktif antara siswa dan guru Bina Sejahtera.
              </p>
            </div>

            {/* Right Side: Navigation Links */}
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 14 }}>Akses Masuk</div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <li><Link href="/login" style={{ color: '#94A3B8' }}>Masuk Akun</Link></li>
                  <li><Link href="/register" style={{ color: '#94A3B8' }}>Daftar Akun Baru</Link></li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 14 }}>Platform</div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <li><a href="#features" style={{ color: '#94A3B8' }}>Fitur Unggulan</a></li>
                  <li><Link href="/student/dashboard" style={{ color: '#94A3B8' }}>Portal Siswa</Link></li>
                  <li><Link href="/teacher/dashboard" style={{ color: '#94A3B8' }}>Portal Guru</Link></li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 14 }}>Pemberi Dana</div>
                <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
                  <div style={{ color: '#CBD5E1', fontWeight: 600 }}>DPPM-Kemdiktisainstek</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Tahun 2026</div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Divider */}
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#64748B' }}>
            <span>© {new Date().getFullYear()} LMS Bina Sejahtera. All rights reserved.</span>
            <span>Platform Pembelajaran Digital Sekolah</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
