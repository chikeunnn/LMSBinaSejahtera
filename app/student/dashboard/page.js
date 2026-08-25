'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookMarked, FileText, Video, ClipboardList, HelpCircle, TrendingUp,
  Sparkles, Key, ChevronRight, ArrowRight, Calendar, Clock, Megaphone, CheckCircle2
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import { CircularProgress, ProgressBar } from '@/components/ui/Progress';
import Modal from '@/components/ui/Modal';
import { StudyIllustration, HeroIllustration } from '@/components/ui/Illustrations';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { formatDateShort, getSubjectGraphic } from '@/lib/utils';

export default function StudentDashboardPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [activeClass, setActiveClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [videos, setVideos] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [stats, setStats] = useState({ subjects: 0, materials: 0, videos: 0, assignments: 0, quizzes: 0 });
  const [loading, setLoading] = useState(true);

  // Modal Join Class
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    if (!profile) return;
    fetchDashboardData();
  }, [profile]);

  async function fetchDashboardData() {
    const supabase = createClient();
    setLoading(true);
    try {
      // 1. Fetch available classes
      const { data: classList } = await supabase.from('classes').select('id, name, code').order('name', { ascending: true });
      setClasses(classList || []);

      // 2. Fetch student's active class info
      let activeClassData = null;
      if (profile.class_id) {
        const { data: cData } = await supabase.from('classes').select('*').eq('id', profile.class_id).maybeSingle();
        activeClassData = cData || null;
      }
      setActiveClass(activeClassData);

      // 3. Fetch subjects, materials, videos, assignments, quizzes in parallel
      const [
        { data: subData, count: subCount },
        { count: matCount },
        { count: vidCount },
        { data: asnData, count: asnCount },
        { data: quizData, count: quizCount },
        { data: annData },
        { data: progData }
      ] = await Promise.all([
        supabase.from('subjects').select('*, profiles(full_name)').order('name', { ascending: true }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('assignments').select('*, subjects(name)').order('deadline', { ascending: true }).limit(4),
        supabase.from('quizzes').select('*, subjects(name)').order('created_at', { ascending: false }).limit(4),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('student_progress').select('*').eq('student_id', profile.id)
      ]);

      const studentSubjects = subData || [];
      setSubjects(studentSubjects);
      setRecentAssignments(asnData || []);
      setRecentQuizzes(quizData || []);
      setAnnouncements(annData || []);

      setStats({
        subjects: subCount || studentSubjects.length,
        materials: matCount || 0,
        videos: vidCount || 0,
        assignments: asnCount || (asnData ? asnData.length : 0),
        quizzes: quizCount || (quizData ? quizData.length : 0)
      });

      if (progData && progData.length > 0) {
        const total = progData.reduce((acc, p) => acc + (p.progress_percentage || 0), 0);
        setOverallProgress(Math.round(total / progData.length));
      } else {
        setOverallProgress(0);
      }

    } catch (e) {
      console.warn('Student Dashboard fetch handled safely:', e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setJoining(true);
    setJoinError('');
    setJoinSuccess('');

    const supabase = createClient();
    try {
      let targetClassId = null;
      let matchedName = '';

      if (classCodeInput.trim()) {
        const cleanCode = classCodeInput.trim().toUpperCase();
        
        const { data: matchedClass } = await supabase
          .from('classes')
          .select('id, name')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (matchedClass) {
          targetClassId = matchedClass.id;
          matchedName = matchedClass.name;
        } else {
          const { data: matchedSubject } = await supabase
            .from('subjects')
            .select('id, name, class_id')
            .or(`code.ilike.${cleanCode},name.ilike.${cleanCode}`)
            .maybeSingle();

          if (matchedSubject && matchedSubject.class_id) {
            targetClassId = matchedSubject.class_id;
            matchedName = matchedSubject.name;
          }
        }
      } else if (selectedClassId) {
        const clsObj = classes.find(c => String(c.id) === String(selectedClassId));
        targetClassId = selectedClassId;
        matchedName = clsObj?.name || 'Kelas Terpilih';
      }

      if (!targetClassId) {
        setJoinError('Kode Kelas / Kode Mapel tidak ditemukan. Pastikan memasukkan kode resmi dari guru.');
        setJoining(false);
        return;
      }

      const { error: updateErr } = await supabase.from('profiles').update({
        class_id: targetClassId,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);

      if (updateErr) throw updateErr;

      setJoinSuccess(`Berhasil bergabung ke ${matchedName}! Memperbarui halaman...`);
      setTimeout(() => {
        setJoinModalOpen(false);
        window.location.reload();
      }, 1200);

    } catch (err) {
      console.error(err);
      setJoinError('Gagal memperbarui kelas: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  const statCards = [
    { icon: BookMarked, label: 'Mata Pelajaran', value: stats.subjects, color: '#2563EB', bg: '#EFF6FF', accent: '#2563EB', href: '/student/subjects' },
    { icon: FileText, label: 'Materi Belajar', value: stats.materials, color: '#059669', bg: '#ECFDF5', accent: '#059669', href: '/student/materials' },
    { icon: Video, label: 'Video Pembelajaran', value: stats.videos, color: '#7C3AED', bg: '#F5F3FF', accent: '#7C3AED', href: '/student/videos' },
    { icon: ClipboardList, label: 'Tugas Kelas', value: stats.assignments, color: '#D97706', bg: '#FFFBEB', accent: '#D97706', href: '/student/assignments' },
    { icon: HelpCircle, label: 'Kuis & Ujian', value: stats.quizzes, color: '#DB2777', bg: '#FDF2F8', accent: '#DB2777', href: '/student/quizzes' },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'Siswa';
  const activeClassName = activeClass?.name || profile?.class_name || 'SMP Bina Sejahtera';
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      
      {/* Hero Welcome Banner */}
      <div className="hero-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', borderRadius: 16, marginBottom: 28, background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)' }}>
        <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
          <div className="badge badge-glass" style={{ marginBottom: 10 }}>
            <Sparkles size={14} /> {currentDateFormatted} • {activeClassName}
          </div>
          <h1 className="hero-title">Halo, {firstName}! 👋</h1>
          <p className="hero-desc" style={{ maxWidth: 520 }}>
            Selamat datang di Portal Siswa LMS Bina Sejahtera. Akses materi, video pembelajaran, kuis interaktif, dan tugas sekolah Anda di satu tempat.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <Link href="/student/subjects">
              <button className="btn" style={{ background: '#FFFFFF', color: '#1D4ED8', fontWeight: 800, gap: 6, minHeight: 40 }}>
                Mulai Belajar <ArrowRight size={16} />
              </button>
            </Link>
            <button
              onClick={() => { setJoinError(''); setJoinSuccess(''); setJoinModalOpen(true); }}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.35)', fontWeight: 700, gap: 6, minHeight: 40, backdropFilter: 'blur(6px)' }}
            >
              <Key size={15} /> Gabung / Ubah Kode Kelas
            </button>
          </div>
        </div>
        <div style={{ zIndex: 1, flexShrink: 0, marginTop: -20, marginBottom: -20, marginRight: -10 }} className="desktop-only">
          <StudyIllustration width={250} height={200} />
        </div>
      </div>

      {/* Modern 5-Column Stat Cards Grid (Match Teacher Dashboard) */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Ringkasan Pembelajaran Saya</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Statistik Real-time</span>
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
      <div className="card card-padding" style={{ marginBottom: 28, borderRadius: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="var(--primary)" /> Aksi Cepat Siswa
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { href: '/student/subjects', label: 'Mata Pelajaran Saya', icon: BookMarked },
            { href: '/student/materials', label: 'Buka Materi', icon: FileText },
            { href: '/student/videos', label: 'Tonton Video', icon: Video },
            { href: '/student/assignments', label: 'Kerjakan Tugas', icon: ClipboardList },
            { href: '/student/quizzes', label: 'Mulai Kuis', icon: HelpCircle },
            { href: '/student/progress', label: 'Progress Belajar', icon: TrendingUp },
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

      {/* Section 1: Daftar Mata Pelajaran Saya */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookMarked size={18} color="var(--primary)" /> Mata Pelajaran Terdaftar ({subjects.length})
          </h2>
          <Link href="/student/subjects" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Lihat Semua <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-3">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}</div>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="Mata Pelajaran Belum Tersedia"
            description="Silakan klik 'Gabung / Ubah Kode Kelas' di atas untuk memuat mata pelajaran kelas Anda."
          />
        ) : (
          <div className="grid grid-3">
            {subjects.slice(0, 6).map((sub) => {
              const graphic = getSubjectGraphic(sub.name);
              return (
                <Link href={`/student/subjects/${sub.id}`} key={sub.id}>
                  <div className="card card-padding card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: graphic.gradient, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {graphic.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{sub.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {sub.profiles?.full_name ? `Guru: ${sub.profiles.full_name}` : 'Mata Pelajaran Resmi'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        <span>Progress Belajar</span>
                        <span>50%</span>
                      </div>
                      <ProgressBar value={50} color={graphic.color} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Split View - Tugas Terbaru & Kuis Terbaru (Match Teacher Dashboard) */}
      <div className="grid grid-2" style={{ gap: 20, marginBottom: 28 }}>
        
        {/* Card 1: Tugas Sekolah */}
        <div className="card card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <ClipboardList size={18} color="#D97706" /> Tugas Sekolah Terbaru
            </h2>
            <Link href="/student/assignments" style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Lihat Tugas
            </Link>
          </div>

          {recentAssignments.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Belum ada tugas yang diberikan guru.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentAssignments.map((asn) => (
                <Link href={`/student/assignments/${asn.id}`} key={asn.id}>
                  <div style={{
                    padding: 12,
                    borderRadius: 12,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{asn.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{asn.subjects?.name || 'Mata Pelajaran'}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> Deadline: {asn.deadline ? formatDateShort(asn.deadline) : 'Tanpa Tenggat'}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706', background: '#FFFBEB', padding: '4px 8px', borderRadius: 6 }}>
                      Kerjakan
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Kuis & Ujian */}
        <div className="card card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <HelpCircle size={18} color="#DB2777" /> Kuis Interaktif
            </h2>
            <Link href="/student/quizzes" style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Lihat Kuis
            </Link>
          </div>

          {recentQuizzes.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Belum ada kuis yang dipublikasikan.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentQuizzes.map((qz) => (
                <Link href={`/student/quizzes/${qz.id}`} key={qz.id}>
                  <div style={{
                    padding: 12,
                    borderRadius: 12,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{qz.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{qz.subjects?.name || 'Mata Pelajaran'}</span>
                        <span>•</span>
                        <span>⏱️ {qz.duration || 15} Menit</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DB2777', background: '#FDF2F8', padding: '4px 8px', borderRadius: 6 }}>
                      Mulai
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal Join Class */}
      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="🔑 Gabung Ke Kelas Pembelajaran">
        <form onSubmit={handleJoinClass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            Setiap kelas / mata pelajaran memiliki <strong>Kode Unik Guru</strong> (misal: <code>K7-2026</code>, <code>K8-2026</code>, <code>MTK-7A</code>). Masukkan kode tersebut atau pilih kelas dari daftar di bawah.
          </div>

          {joinError && (
            <div style={{ padding: 10, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 13 }}>
              {joinError}
            </div>
          )}

          {joinSuccess && (
            <div style={{ padding: 10, borderRadius: 8, background: '#F0FDF4', color: '#166534', fontSize: 13, fontWeight: 600 }}>
              {joinSuccess}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Masukkan Kode Kelas / Kode Mapel:</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: K7-2026 atau MTK-7A"
              value={classCodeInput}
              onChange={e => setClassCodeInput(e.target.value)}
              style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
            />
          </div>

          {classes.length > 0 && (
            <div className="form-group">
              <label className="form-label">Atau Pilih Kelas Dari Daftar Sekolah:</label>
              <select
                className="form-input"
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
              >
                <option value="">-- Pilih Kelas Sekolah --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setJoinModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={joining}>
              {joining ? 'Memproses...' : 'Gabung Kelas Sekarang'}
            </button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  );
}
