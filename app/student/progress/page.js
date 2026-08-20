'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CircularProgress, ProgressBar } from '@/components/ui/Progress';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, BookMarked, Video, HelpCircle, ClipboardList, Award, RefreshCw } from 'lucide-react';

export default function StudentProgressPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  
  const [subjectProgressList, setSubjectProgressList] = useState([]);
  const [stats, setStats] = useState({ materials: 0, videos: 0, quizzes: 0, assignments: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchProgress();
  }, [profile]);

  async function fetchProgress() {
    const supabase = createClient();
    setLoading(true);
    try {
      // 1. Parallel fetch all system content & student completion entries
      const [
        { data: subjectsData },
        { data: materialsData },
        { data: videosData },
        { data: quizzesData },
        { data: assignmentsData },
        { data: matProg },
        { data: vidProg },
        { data: quizProg },
        { data: asnProg }
      ] = await Promise.all([
        supabase.from('subjects').select('*').order('name', { ascending: true }),
        supabase.from('materials').select('id, subject_id'),
        supabase.from('videos').select('id, subject_id'),
        supabase.from('quizzes').select('id, subject_id'),
        supabase.from('assignments').select('id, subject_id'),
        supabase.from('material_progress').select('material_id, status').eq('student_id', profile.id),
        supabase.from('video_progress').select('video_id, is_completed').eq('student_id', profile.id),
        supabase.from('quiz_attempts').select('quiz_id, status, is_submitted').eq('student_id', profile.id),
        supabase.from('assignment_submissions').select('assignment_id').eq('student_id', profile.id),
      ]);

      const completedMatSet = new Set((matProg || []).filter(p => p.status === 'completed').map(p => p.material_id));
      const completedVidSet = new Set((vidProg || []).filter(p => p.is_completed).map(p => p.video_id));
      const completedQuizSet = new Set((quizProg || []).filter(p => p.status === 'completed' || p.is_submitted).map(p => p.quiz_id));
      const submittedAsnSet = new Set((asnProg || []).map(p => p.assignment_id));

      // Global Stat Counts
      setStats({
        materials: completedMatSet.size,
        videos: completedVidSet.size,
        quizzes: completedQuizSet.size,
        assignments: submittedAsnSet.size,
      });

      const subjects = subjectsData || [];
      const calculatedList = [];

      // 2. Calculate progress dynamically for EVERY subject
      for (const sub of subjects) {
        const subMats = (materialsData || []).filter(m => m.subject_id === sub.id);
        const subVids = (videosData || []).filter(v => v.subject_id === sub.id);
        const subQuizzes = (quizzesData || []).filter(q => q.subject_id === sub.id);
        const subAsns = (assignmentsData || []).filter(a => a.subject_id === sub.id);

        const doneMats = subMats.filter(m => completedMatSet.has(m.id)).length;
        const doneVids = subVids.filter(v => completedVidSet.has(v.id)).length;
        const doneQuizzes = subQuizzes.filter(q => completedQuizSet.has(q.id)).length;
        const doneAsns = subAsns.filter(a => submittedAsnSet.has(a.id)).length;

        const totalItems = subMats.length + subVids.length + subQuizzes.length + subAsns.length;
        const completedItems = doneMats + doneVids + doneQuizzes + doneAsns;

        let pct = 0;
        if (totalItems > 0) {
          pct = Math.round((completedItems / totalItems) * 100);
        } else if (completedItems > 0) {
          pct = 100;
        }

        calculatedList.push({
          id: sub.id,
          name: sub.name,
          progress_percentage: pct,
          completed_materials: doneMats,
          total_materials: subMats.length,
          total_items: totalItems,
          completed_items: completedItems
        });

        // 3. Upsert back to database in background to keep student_progress synced
        supabase.from('student_progress').upsert({
          student_id: profile.id,
          subject_id: sub.id,
          progress_percentage: pct,
          completed_materials: doneMats,
          total_materials: subMats.length,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,subject_id' }).then(() => {}).catch(() => {});
      }

      setSubjectProgressList(calculatedList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchProgress();
  };

  const overall = subjectProgressList.length > 0
    ? Math.round(subjectProgressList.reduce((a, p) => a + (p.progress_percentage || 0), 0) / subjectProgressList.length)
    : 0;

  const statItems = [
    { icon: BookMarked, label: 'Materi Selesai', value: stats.materials, color: '#2563EB', bg: '#DBEAFE' },
    { icon: Video, label: 'Video Ditonton', value: stats.videos, color: '#7C3AED', bg: '#EDE9FE' },
    { icon: HelpCircle, label: 'Kuis Selesai', value: stats.quizzes, color: '#059669', bg: '#D1FAE5' },
    { icon: ClipboardList, label: 'Tugas Dikumpulkan', value: stats.assignments, color: '#D97706', bg: '#FEF3C7' },
  ];

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Progress Belajar</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Pantau perkembangan belajarmu yang tersinkronisasi secara otomatis
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="btn btn-outline btn-sm"
          style={{ gap: 6 }}
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Memutakhirkan...' : 'Sinkronkan Progress'}
        </button>
      </div>

      {/* Overall progress card */}
      <div className="card card-padding" style={{ display: 'flex', gap: 28, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <CircularProgress value={overall} size={120} />
        <div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Progress Keseluruhan</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{overall}%</div>
          <div style={{ fontSize: 14, color: overall >= 70 ? 'var(--success)' : 'var(--warning)', marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={16} />
            {overall >= 80 ? 'Luar biasa! Pertahankan!' : overall >= 60 ? 'Hebat! Teruskan belajarmu.' : overall >= 40 ? 'Bagus, terus semangat!' : 'Ayo mulai belajar lebih giat!'}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {statItems.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={22} /></div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Per subject progress list */}
      <div className="card card-padding">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Progress Per Mata Pelajaran</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i}>
                <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 8 }} />
              </div>
            ))}
          </div>
        ) : subjectProgressList.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Belum Ada Mata Pelajaran" description="Mata pelajaran yang dibuat guru akan tampil di sini secara otomatis." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {subjectProgressList.map(p => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  <span>📘 {p.name}</span>
                  <span style={{ color: 'var(--primary)' }}>{p.progress_percentage}%</span>
                </div>
                <ProgressBar value={p.progress_percentage} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {p.completed_materials}/{p.total_materials} materi diselesaikan • ({p.completed_items}/{p.total_items} total aktivitas)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
