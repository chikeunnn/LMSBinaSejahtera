'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookMarked, FileText, Video, ClipboardList, HelpCircle, TrendingUp,
  Sparkles, Key, ChevronRight, ArrowRight, Calendar, Clock, Megaphone, AlertCircle
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import { CircularProgress, ProgressBar } from '@/components/ui/Progress';
import Modal from '@/components/ui/Modal';
import { StudyIllustration } from '@/components/ui/Illustrations';
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
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [subjectProgressMap, setSubjectProgressMap] = useState({});
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
      // 1. Fetch available classes list for fallback modal
      const { data: classList } = await supabase.from('classes').select('id, name, code').order('name', { ascending: true });
      setClasses(classList || []);

      // 2. Fetch student's active class info
      let activeClassData = null;
      if (profile.class_id) {
        const { data: cData } = await supabase.from('classes').select('*').eq('id', profile.class_id).maybeSingle();
        activeClassData = cData || null;
      }
      setActiveClass(activeClassData);

      // 3. Fetch subjects STRICTLY FILTERED BY JOINED CLASS (No fallback to all subjects)
      let studentSubjects = [];
      if (profile.class_id) {
        const { data: subData } = await supabase
          .from('subjects')
          .select('*, profiles(full_name)')
          .eq('class_id', profile.class_id)
          .order('name', { ascending: true });
        studentSubjects = subData || [];
      }
      setSubjects(studentSubjects);

      // 4. Fetch announcements
      const { data: annData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3);
      setAnnouncements(annData || []);

      // 5. Dynamic Progress & Activity Stats Calculation
      let doneMat = 0, doneVid = 0, doneQuiz = 0, doneAsn = 0;
      let totalMat = 0, totalVid = 0, totalQuiz = 0, totalAsn = 0;
      const subProgMap = {};

      if (studentSubjects.length > 0) {
        const subjectIds = studentSubjects.map(s => s.id);

        const [
          { data: matsData },
          { data: vidsData },
          { data: quizData },
          { data: asnsData },
          { data: matProg },
          { data: vidProg },
          { data: quizProg },
          { data: asnProg }
        ] = await Promise.all([
          supabase.from('materials').select('id, subject_id').in('subject_id', subjectIds),
          supabase.from('videos').select('id, subject_id').in('subject_id', subjectIds),
          supabase.from('quizzes').select('id, subject_id').in('subject_id', subjectIds),
          supabase.from('assignments').select('id, subject_id, title, deadline, subjects(name)').in('subject_id', subjectIds).order('deadline', { ascending: true }).limit(4),
          supabase.from('material_progress').select('material_id, status').eq('student_id', profile.id),
          supabase.from('video_progress').select('video_id, is_completed').eq('student_id', profile.id),
          supabase.from('quiz_attempts').select('quiz_id, status, is_submitted').eq('student_id', profile.id),
          supabase.from('assignment_submissions').select('assignment_id').eq('student_id', profile.id)
        ]);

        setRecentAssignments(asnsData || []);

        const { data: recentQuizList } = await supabase
          .from('quizzes')
          .select('*, subjects(name)')
          .in('subject_id', subjectIds)
          .order('created_at', { ascending: false })
          .limit(4);

        setRecentQuizzes(recentQuizList || []);

        const completedMatSet = new Set((matProg || []).filter(p => p.status === 'completed').map(p => p.material_id));
        const completedVidSet = new Set((vidProg || []).filter(p => p.is_completed).map(p => p.video_id));
        const completedQuizSet = new Set((quizProg || []).filter(p => p.status === 'completed' || p.is_submitted).map(p => p.quiz_id));
        const submittedAsnSet = new Set((asnProg || []).map(p => p.assignment_id));

        totalMat = (matsData || []).length;
        totalVid = (vidsData || []).length;
        totalQuiz = (quizData || []).length;
        totalAsn = (asnsData || []).length;

        doneMat = (matsData || []).filter(m => completedMatSet.has(m.id)).length;
        doneVid = (vidsData || []).filter(v => completedVidSet.has(v.id)).length;
        doneQuiz = (quizData || []).filter(q => completedQuizSet.has(q.id)).length;
        doneAsn = (asnsData || []).filter(a => submittedAsnSet.has(a.id)).length;

        // Calculate progress per subject
        for (const sub of studentSubjects) {
          const sMats = (matsData || []).filter(m => m.subject_id === sub.id);
          const sVids = (vidsData || []).filter(v => v.subject_id === sub.id);
          const sQuiz = (quizData || []).filter(q => q.subject_id === sub.id);
          const sAsns = (asnsData || []).filter(a => a.subject_id === sub.id);

          const sDoneMat = sMats.filter(m => completedMatSet.has(m.id)).length;
          const sDoneVid = sVids.filter(v => completedVidSet.has(v.id)).length;
          const sDoneQuiz = sQuiz.filter(q => completedQuizSet.has(q.id)).length;
          const sDoneAsn = sAsns.filter(a => submittedAsnSet.has(a.id)).length;

          const sTotal = sMats.length + sVids.length + sQuiz.length + sAsns.length;
          const sDone = sDoneMat + sDoneVid + sDoneQuiz + sDoneAsn;

          let sPct = 0;
          if (sTotal > 0) {
            sPct = Math.round((sDone / sTotal) * 100);
          } else if (sDone > 0) {
            sPct = 100;
          }

          subProgMap[sub.id] = sPct;
        }
      }

      setSubjectProgressMap(subProgMap);

      setStats({
        subjects: studentSubjects.length,
        materials: doneMat,
        videos: doneVid,
        assignments: doneAsn,
        quizzes: doneQuiz
      });

      const totalActivities = totalMat + totalVid + totalQuiz + totalAsn;
      const completedActivities = doneMat + doneVid + doneQuiz + doneAsn;

      let calcProgress = 0;
      if (totalActivities > 0) {
        calcProgress = Math.round((completedActivities / totalActivities) * 100);
      } else if (completedActivities > 0) {
        calcProgress = 100;
      }

      setOverallProgress(calcProgress);

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
    { icon: FileText, label: 'Materi Selesai', value: stats.materials, color: '#059669', bg: '#ECFDF5', accent: '#059669', href: '/student/materials' },
    { icon: Video, label: 'Video Ditonton', value: stats.videos, color: '#7C3AED', bg: '#F5F3FF', accent: '#7C3AED', href: '/student/videos' },
    { icon: ClipboardList, label: 'Tugas Dikumpulkan', value: stats.assignments, color: '#D97706', bg: '#FFFBEB', accent: '#D97706', href: '/student/assignments' },
    { icon: HelpCircle, label: 'Kuis Diselesaikan', value: stats.quizzes, color: '#DB2777', bg: '#FDF2F8', accent: '#DB2777', href: '/student/quizzes' },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'Siswa';
  const activeClassName = activeClass?.name || profile?.class_name || null;
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      
      {/* Hero Welcome Banner */}
      <div className="hero-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', borderRadius: 16, marginBottom: 28, background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)' }}>
        <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
          <div className="badge badge-glass" style={{ marginBottom: 10 }}>
            <Sparkles size={14} /> {currentDateFormatted} • {activeClassName || 'Belum Masuk Kelas'}
          </div>
          <h1 className="hero-title">Halo, {firstName}! 👋</h1>
          <p className="hero-desc" style={{ maxWidth: 520 }}>
            {activeClassName
              ? `Selamat datang di Portal Siswa LMS Bina Sejahtera. Anda saat ini terdaftar di ${activeClassName}.`
              : 'Anda belum terdaftar di kelas manapun. Silakan klik tombol di bawah untuk memasukkan Kode Kelas resmi dari guru.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {activeClassName && (
              <Link href="/student/subjects">
                <button className="btn" style={{ background: '#FFFFFF', color: '#1D4ED8', fontWeight: 800, gap: 6, minHeight: 40 }}>
                  Mulai Belajar <ArrowRight size={16} />
                </button>
              </Link>
            )}
            <button
              onClick={() => { setJoinError(''); setJoinSuccess(''); setJoinModalOpen(true); }}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.35)', fontWeight: 700, gap: 6, minHeight: 40, backdropFilter: 'blur(6px)' }}
            >
              <Key size={15} /> {activeClassName ? 'Ubah Kode Kelas' : '🔑 Masukkan Kode Kelas'}
            </button>
          </div>
        </div>
        <div style={{ zIndex: 1, flexShrink: 0, marginTop: -20, marginBottom: -20, marginRight: -10 }} className="desktop-only">
          <StudyIllustration width={250} height={200} />
        </div>
      </div>

      {/* Modern 5-Column Stat Cards Grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Ringkasan Pembelajaran Saya</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Progress Real-time ({overallProgress}%)</span>
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
            { href: '/student/subjects', label: 'Mata Pelajaran Kelas', icon: BookMarked },
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

      {/* Section 1: Daftar Mata Pelajaran Terdaftar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookMarked size={18} color="var(--primary)" /> Mata Pelajaran Kelas Saya ({subjects.length})
          </h2>
          {subjects.length > 0 && (
            <Link href="/student/subjects" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Lihat Semua <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-3">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}</div>
        ) : subjects.length === 0 ? (
          <div className="card card-padding" style={{ textAlign: 'center', padding: '36px 24px', borderRadius: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {activeClassName ? `Belum Ada Mata Pelajaran di ${activeClassName}` : 'Anda Belum Masuk Kelas'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
              {activeClassName
                ? 'Guru belum mendaftarkan mata pelajaran untuk kelas Anda. Hubungi wali kelas atau masukkan kode mata pelajaran baru.'
                : 'Mata pelajaran hanya akan muncul sesuai kelas yang Anda masuki. Silakan klik tombol di bawah untuk bergabung ke kelas Anda.'}
            </p>
            <button
              onClick={() => { setJoinError(''); setJoinSuccess(''); setJoinModalOpen(true); }}
              className="btn btn-primary btn-sm"
              style={{ gap: 8 }}
            >
              <Key size={16} /> 🔑 Masukkan Kode Kelas Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-3">
            {subjects.slice(0, 6).map((sub) => {
              const graphic = getSubjectGraphic(sub.name);
              const subPct = subjectProgressMap[sub.id] || 0;

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
                        <span>{subPct}%</span>
                      </div>
                      <ProgressBar value={subPct} color={graphic.color} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Split View - Tugas Terbaru & Kuis Terbaru */}
      <div className="grid grid-2" style={{ gap: 20, marginBottom: 28 }}>
        
        {/* Card 1: Tugas Sekolah */}
        <div className="card card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <ClipboardList size={18} color="#D97706" /> Tugas Sekolah Kelas
            </h2>
            <Link href="/student/assignments" style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Lihat Semua
            </Link>
          </div>

          {recentAssignments.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Belum ada tugas di kelas ini.
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
                    justify: 'space-between',
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
              <HelpCircle size={18} color="#DB2777" /> Kuis Interaktif Kelas
            </h2>
            <Link href="/student/quizzes" style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Lihat Semua
            </Link>
          </div>

          {recentQuizzes.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Belum ada kuis di kelas ini.
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
                    justify: 'space-between',
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
