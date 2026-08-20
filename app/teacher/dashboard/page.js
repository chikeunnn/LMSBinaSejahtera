'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import {
  BookMarked, Users, FileText, ClipboardList, HelpCircle, TrendingUp,
  PlusCircle, Sparkles, Megaphone, ArrowRight, Clock, ChevronRight, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import { StudyIllustration } from '@/components/ui/Illustrations';

export default function TeacherDashboard() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const [stats, setStats] = useState({ subjects: 0, students: 0, materials: 0, assignments: 0, quizzes: 0 });
  const [recentSubjects, setRecentSubjects] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchDashboardData();
  }, [profile]);

  async function fetchDashboardData() {
    const supabase = createClient();
    setLoading(true);

    try {
      // 1. Fetch exact total counts without strict filter lock
      const [
        { count: subjectsCount, data: subjectsData },
        { count: materialsCount },
        { count: assignmentsCount, data: assignmentsData },
        { count: quizzesCount, data: quizzesData },
        { count: totalStudents }
      ] = await Promise.all([
        supabase.from('subjects').select('*, classes(name)', { count: 'exact' }).limit(6),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('assignments').select('*, subjects(name)', { count: 'exact' }).order('created_at', { ascending: false }).limit(4),
        supabase.from('quizzes').select('*, subjects(name)', { count: 'exact' }).order('created_at', { ascending: false }).limit(4),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
      ]);

      setStats({
        subjects: subjectsCount || (subjectsData ? subjectsData.length : 0),
        students: totalStudents || 0,
        materials: materialsCount || 0,
        assignments: assignmentsCount || (assignmentsData ? assignmentsData.length : 0),
        quizzes: quizzesCount || (quizzesData ? quizzesData.length : 0)
      });

      setRecentSubjects(subjectsData || []);
      setRecentAssignments(assignmentsData || []);
      setRecentQuizzes(quizzesData || []);
    } catch (e) {
      console.warn('Dashboard data fetch handled safely:', e.message);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { icon: BookMarked, label: 'Mata Pelajaran', value: stats.subjects, color: '#2563EB', bg: '#EFF6FF', accent: '#2563EB', href: '/teacher/subjects' },
    { icon: Users, label: 'Total Siswa', value: stats.students, color: '#7C3AED', bg: '#F5F3FF', accent: '#7C3AED', href: '/teacher/students' },
    { icon: FileText, label: 'Materi', value: stats.materials, color: '#059669', bg: '#ECFDF5', accent: '#059669', href: '/teacher/materials' },
    { icon: ClipboardList, label: 'Tugas', value: stats.assignments, color: '#D97706', bg: '#FFFBEB', accent: '#D97706', href: '/teacher/assignments' },
    { icon: HelpCircle, label: 'Kuis', value: stats.quizzes, color: '#DB2777', bg: '#FDF2F8', accent: '#DB2777', href: '/teacher/quizzes' },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'Guru';
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      
      {/* Hero Welcome Banner */}
      <div className="hero-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', borderRadius: 16 }}>
        <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
          <div className="badge badge-glass" style={{ marginBottom: 10 }}>
            <Sparkles size={14} /> {currentDateFormatted}
          </div>
          <h1 className="hero-title">Halo, {firstName}! 👋</h1>
          <p className="hero-desc" style={{ maxWidth: 500 }}>
            Selamat datang di Portal Guru LMS Bina Sejahtera. Kelola mata pelajaran, kuis, tugas, dan materi pembelajaran siswa di satu dasbor terpadu.
          </p>
        </div>
        <div style={{ zIndex: 1, flexShrink: 0, marginTop: -20, marginBottom: -20, marginRight: -10 }} className="desktop-only">
          <StudyIllustration width={240} height={190} />
        </div>
      </div>

      {/* Modern 5-Column Stat Cards Grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Ringkasan Pembelajaran</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Real-time Statistics</span>
        </div>

        <div className="grid grid-5">
          {statCards.map((s, i) => (
            <Link href={s.href} key={i}>
              <div
                className="stat-card"
                style={{ '--stat-accent': s.accent, cursor: 'pointer' }}
              >
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                  <s.icon size={24} />
                </div>
                <div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{loading ? '...' : s.value}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Action Panel */}
      <div className="card card-padding" style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusCircle size={18} color="var(--primary)" /> Aksi Cepat Pengajar
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { href: '/teacher/subjects', label: 'Mata Pelajaran Baru', icon: BookMarked },
            { href: '/teacher/materials', label: 'Materi Baru', icon: FileText },
            { href: '/teacher/quizzes', label: 'Kuis Baru', icon: HelpCircle },
            { href: '/teacher/assignments', label: 'Tugas Baru', icon: ClipboardList },
            { href: '/teacher/announcements', label: 'Buat Pengumuman', icon: Megaphone },
          ].map((a, i) => (
            <Link key={i} href={a.href}>
              <button
                className="btn btn-outline btn-sm"
                style={{
                  borderRadius: 12,
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: 13,
                  gap: 8,
                  borderColor: 'var(--border)'
                }}
              >
                <a.icon size={16} color="var(--primary)" />
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 1: Daftar Mata Pelajaran Aktif */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookMarked size={18} color="var(--primary)" /> Mata Pelajaran Sekolah
          </h2>
          <Link href="/teacher/subjects" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Lihat Semua <ChevronRight size={14} />
          </Link>
        </div>

        {recentSubjects.length === 0 ? (
          <div className="card card-padding" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada mata pelajaran terdaftar.</div>
          </div>
        ) : (
          <div className="grid grid-3">
            {recentSubjects.map((sub) => (
              <div key={sub.id} className="card card-padding card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: '#EFF6FF',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800
                  }}>
                    <BookMarked size={20} />
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: 'var(--primary-light)',
                    color: 'var(--primary)'
                  }}>
                    {sub.classes?.name || 'Semua Kelas'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{sub.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Kode: {sub.code || 'SMP'}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <Link href="/teacher/materials">
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 12px', fontSize: 12, borderRadius: 8 }}>
                      Kelola Materi <ArrowRight size={12} />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Split View - Tugas Terbaru & Kuis Terbaru */}
      <div className="grid grid-2" style={{ gap: 20 }}>
        
        {/* Card 1: Tugas Terbaru */}
        <div className="card card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <ClipboardList size={18} color="#D97706" /> Daftar Tugas Terbaru
            </h2>
            <Link href="/teacher/assignments" style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Kelola Tugas
            </Link>
          </div>

          {recentAssignments.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Belum ada tugas yang dibuat.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentAssignments.map((asn) => (
                <div key={asn.id} style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{asn.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{asn.subjects?.name || 'Mata Pelajaran'}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> Deadline: {asn.due_date ? new Date(asn.due_date).toLocaleDateString('id-ID') : 'Tanpa Tenggat'}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706', background: '#FFFBEB', padding: '4px 8px', borderRadius: 6 }}>
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Kuis Terbaru */}
        <div className="card card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <HelpCircle size={18} color="#DB2777" /> Kuis Interaktif Terbaru
            </h2>
            <Link href="/teacher/quizzes" style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Kelola Kuis
            </Link>
          </div>

          {recentQuizzes.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Belum ada kuis yang dibuat.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentQuizzes.map((qz) => (
                <div key={qz.id} style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{qz.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{qz.subjects?.name || 'Mata Pelajaran'}</span>
                      <span>•</span>
                      <span>{qz.duration || 30} Menit</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#DB2777', background: '#FDF2F8', padding: '4px 8px', borderRadius: 6 }}>
                    {qz.passing_score ? `KKM ${qz.passing_score}` : 'Kuis'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </DashboardLayout>
  );
}
