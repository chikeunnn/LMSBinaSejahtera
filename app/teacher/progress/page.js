'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Award, ClipboardList, Search, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function TeacherProgressPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [studentStats, setStudentStats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchProgressData();
  }, [profile]);

  async function fetchProgressData() {
    const supabase = createClient();
    setLoading(true);
    try {
      // 1. Fetch all student profiles with class info
      let { data: students } = await supabase
        .from('profiles')
        .select('*, classes(name, grade)')
        .eq('role', 'student')
        .order('full_name', { ascending: true });

      if (!students || students.length === 0) {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*, classes(name, grade)')
          .order('full_name', { ascending: true });
        students = (allProfiles || []).filter(p => p.role !== 'teacher' && p.role !== 'admin');
      }

      // 2. Fetch parallel activity records
      const [
        { data: matProg },
        { data: vidProg },
        { data: quizAttempts },
        { data: submissions },
        { data: totalMats },
        { data: totalQuizzes },
        { data: totalAsns }
      ] = await Promise.all([
        supabase.from('material_progress').select('student_id, status').eq('status', 'completed'),
        supabase.from('video_progress').select('student_id, is_completed').eq('is_completed', true),
        supabase.from('quiz_attempts').select('student_id, score, max_score, is_submitted, status'),
        supabase.from('assignment_submissions').select('student_id, score, status'),
        supabase.from('materials').select('id'),
        supabase.from('quizzes').select('id'),
        supabase.from('assignments').select('id'),
      ]);

      const systemTotalActivities = Math.max(1, (totalMats?.length || 0) + (totalQuizzes?.length || 0) + (totalAsns?.length || 0));

      // 3. Dynamic student activity mapping
      const stats = (students || []).map(std => {
        const myMats = (matProg || []).filter(m => m.student_id === std.id);
        const myVids = (vidProg || []).filter(v => v.student_id === std.id);
        const myQuizzes = (quizAttempts || []).filter(q => q.student_id === std.id && (q.is_submitted || q.status === 'completed'));
        const mySubmissions = (submissions || []).filter(s => s.student_id === std.id);

        const avgQuizScore = myQuizzes.length > 0
          ? Math.round(myQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) / myQuizzes.length)
          : 0;

        const gradedSubmissions = mySubmissions.filter(s => s.score !== null && s.score !== undefined);
        const avgAsnScore = gradedSubmissions.length > 0
          ? Math.round(gradedSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSubmissions.length)
          : 0;

        // Accurate real-time completion rate
        const totalCompletedByStudent = myMats.length + myVids.length + myQuizzes.length + mySubmissions.length;
        const completionRate = Math.min(100, Math.round((totalCompletedByStudent / systemTotalActivities) * 100));

        return {
          ...std,
          materialsCount: myMats.length,
          videosCount: myVids.length,
          quizCount: myQuizzes.length,
          avgQuizScore,
          submissionCount: mySubmissions.length,
          avgAsnScore,
          completionRate
        };
      });

      setStudentStats(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchProgressData();
  };

  const filteredStats = studentStats.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email?.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedGrade === 'ALL') return matchesSearch;
    return matchesSearch && s.classes?.grade === parseInt(selectedGrade);
  });

  const totalAverageQuiz = studentStats.length > 0
    ? Math.round(studentStats.reduce((acc, s) => acc + s.avgQuizScore, 0) / studentStats.length)
    : 0;

  const totalAverageAsn = studentStats.length > 0
    ? Math.round(studentStats.reduce((acc, s) => acc + s.avgAsnScore, 0) / studentStats.length)
    : 0;

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Progress & Evaluasi Belajar Siswa</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Pantau pencapaian kuis, pengumpulan tugas, dan tingkat penyelesaian materi setiap siswa secara otomatis
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

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{studentStats.length} Siswa</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dipantau Aktif</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{totalAverageQuiz} / 100</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rata-rata Kuis Siswa</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{totalAverageAsn} / 100</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rata-rata Nilai Tugas</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card card-padding" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
            >
              <option value="ALL">Semua Kelas</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Progress List */}
      {loading ? (
        <div className="skeleton" style={{ height: 250, borderRadius: 16 }} />
      ) : filteredStats.length === 0 ? (
        <EmptyState icon={TrendingUp} title="Data Progress Tidak Ditemukan" description="Belum ada data aktivitas siswa." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredStats.map(st => (
            <div key={st.id} className="card card-padding" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'center' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={st.full_name || st.email} src={st.avatar_url} size={48} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{st.full_name || 'Tanpa Nama'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{st.classes?.name || 'Kelas Umum'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Kuis Dikerjakan</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {st.quizCount} Kuis (Rata-rata: {st.avgQuizScore})
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Tugas Dikumpulkan</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {st.submissionCount} Tugas (Rata-rata: {st.avgAsnScore})
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  <span>Tingkat Penyelesaian</span>
                  <span style={{ color: 'var(--primary)' }}>{st.completionRate}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--bg-main)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${st.completionRate}%`,
                      background: st.completionRate > 75 ? '#10B981' : st.completionRate > 40 ? '#F59E0B' : 'var(--primary)',
                      borderRadius: 4,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
